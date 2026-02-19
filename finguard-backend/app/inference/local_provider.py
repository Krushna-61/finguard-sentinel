import torch
import time
import asyncio
from typing import Dict
from app.inference.base_provider import InferenceProvider
from app.core.model_registry import ModelRegistry
from app.utils.logging_utils import setup_logger

logger = setup_logger(__name__)

class LocalProvider(InferenceProvider):
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        try:
            self.registry = ModelRegistry()
            
            if not self.registry.is_ready():
                raise RuntimeError("ModelRegistry is not ready")
            
            logger.info("LocalProvider initialized with preloaded models")
            self._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize LocalProvider: {e}")
            self._initialized = False
            raise
    
    async def detect_pii(self, text: str) -> Dict:
        start_time = time.perf_counter()
        
        try:
            with torch.no_grad():
                entities = await asyncio.to_thread(self.registry.ner_pipeline, text)
            
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            pii_entities = ["PER", "PERSON", "ORG", "LOC", "GPE"]
            detected = any(
                entity.get("entity_group", "").upper() in pii_entities
                for entity in entities
            )
            
            return {
                "success": True,
                "latency_ms": latency_ms,
                "data": {
                    "pii_detected": detected,
                    "entities": entities
                },
                "error": None
            }
        
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Local PII detection failed: {e}")
            return {
                "success": False,
                "latency_ms": latency_ms,
                "data": None,
                "error": str(e)
            }
    
    async def detect_toxicity(self, text: str) -> Dict:
        start_time = time.perf_counter()
        
        try:
            with torch.no_grad():
                result = await asyncio.to_thread(self.registry.toxicity_pipeline, text)
            
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            toxic_score = 0.0
            if result and len(result) > 0:
                for item in result:
                    if item.get("label", "").lower() in ["toxic", "toxicity"]:
                        toxic_score = item.get("score", 0.0)
                        break
            
            return {
                "success": True,
                "latency_ms": latency_ms,
                "data": {"toxicity_score": toxic_score},
                "error": None
            }
        
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Local toxicity detection failed: {e}")
            return {
                "success": False,
                "latency_ms": latency_ms,
                "data": None,
                "error": str(e)
            }
    
    async def get_embeddings(self, text: str) -> Dict:
        start_time = time.perf_counter()
        
        try:
            with torch.no_grad():
                embeddings = await asyncio.to_thread(
                    self.registry.embedding_model.encode,
                    text,
                    convert_to_numpy=True
                )
            
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            return {
                "success": True,
                "latency_ms": latency_ms,
                "data": {"embeddings": embeddings.tolist()},
                "error": None
            }
        
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Local embedding generation failed: {e}")
            return {
                "success": False,
                "latency_ms": latency_ms,
                "data": None,
                "error": str(e)
            }
    
    async def check_hallucination(self, premise: str, hypothesis: str) -> Dict:
        start_time = time.perf_counter()
        
        try:
            with torch.no_grad():
                result = await asyncio.to_thread(
                    self.registry.nli_pipeline,
                    hypothesis,
                    candidate_labels=["entailment", "contradiction", "neutral"],
                    hypothesis_template="This text: {}"
                )
            
            latency_ms = (time.perf_counter() - start_time) * 1000
            
            contradiction_score = 0.0
            if result and "labels" in result and "scores" in result:
                for label, score in zip(result["labels"], result["scores"]):
                    if label.lower() == "contradiction":
                        contradiction_score = score
                        break
            
            return {
                "success": True,
                "latency_ms": latency_ms,
                "data": {"hallucination_score": contradiction_score},
                "error": None
            }
        
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(f"Local hallucination detection failed: {e}")
            return {
                "success": False,
                "latency_ms": latency_ms,
                "data": None,
                "error": str(e)
            }
