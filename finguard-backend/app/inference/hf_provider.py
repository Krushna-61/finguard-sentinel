import httpx
import time
import asyncio
from typing import Dict, Any
from app.inference.base_provider import InferenceProvider
from app.core.settings import settings
from app.utils.logging_utils import setup_logger

logger = setup_logger(__name__)

class HFProvider(InferenceProvider):
    
    def __init__(self):
        self.api_base = "https://api-inference.huggingface.co/models"
        self.token = settings.hf_api_token
        self.timeout = settings.hf_timeout
        self.max_retries = settings.hf_max_retries
        self.failure_threshold = settings.hf_failure_threshold
        self.failure_count = 0
        self.circuit_open = False
        self.circuit_open_time = None
        self.circuit_reset_timeout = 60
        
        self.models = {
            "pii": "dslim/bert-base-NER",
            "toxicity": "unitary/toxic-bert",
            "embeddings": "sentence-transformers/all-MiniLM-L6-v2",
            "hallucination": "cross-encoder/nli-distilroberta-base"
        }
    
    def _check_circuit(self) -> bool:
        if not self.circuit_open:
            return True
        
        if time.time() - self.circuit_open_time > self.circuit_reset_timeout:
            logger.info("Circuit breaker reset - attempting recovery")
            self.circuit_open = False
            self.failure_count = 0
            return True
        
        return False
    
    def _record_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            logger.error(f"Circuit breaker opened after {self.failure_count} failures")
            self.circuit_open = True
            self.circuit_open_time = time.time()
    
    def _record_success(self):
        if self.failure_count > 0:
            self.failure_count = max(0, self.failure_count - 1)
    
    async def _make_request(self, model_name: str, payload: Dict[str, Any]) -> Dict:
        if not self._check_circuit():
            return {
                "success": False,
                "latency_ms": 0.0,
                "data": None,
                "error": "Circuit breaker open - service temporarily unavailable"
            }
        
        url = f"{self.api_base}/{model_name}"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        start_time = time.perf_counter()
        
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload,
                        timeout=self.timeout
                    )
                    
                    latency_ms = (time.perf_counter() - start_time) * 1000
                    
                    if response.status_code == 200:
                        self._record_success()
                        return {
                            "success": True,
                            "latency_ms": latency_ms,
                            "data": response.json(),
                            "error": None
                        }
                    else:
                        error_msg = f"HTTP {response.status_code}"
                        if attempt < self.max_retries:
                            await asyncio.sleep(2 ** attempt)
                            continue
                        else:
                            self._record_failure()
                            return {
                                "success": False,
                                "latency_ms": latency_ms,
                                "data": None,
                                "error": error_msg
                            }
            
            except httpx.TimeoutException:
                latency_ms = (time.perf_counter() - start_time) * 1000
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
                else:
                    self._record_failure()
                    return {
                        "success": False,
                        "latency_ms": latency_ms,
                        "data": None,
                        "error": "Request timeout"
                    }
            
            except Exception as e:
                latency_ms = (time.perf_counter() - start_time) * 1000
                logger.error(f"Request failed: {str(e)}")
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
                else:
                    self._record_failure()
                    return {
                        "success": False,
                        "latency_ms": latency_ms,
                        "data": None,
                        "error": "Request failed"
                    }
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        self._record_failure()
        return {
            "success": False,
            "latency_ms": latency_ms,
            "data": None,
            "error": "Max retries exceeded"
        }
    
    async def detect_pii(self, text: str) -> Dict:
        payload = {"inputs": text}
        result = await self._make_request(self.models["pii"], payload)
        
        if result["success"] and result["data"]:
            entities = result["data"]
            pii_entities = ["PER", "PERSON", "ORG", "LOC", "GPE"]
            detected = any(
                entity.get("entity_group", "").upper() in pii_entities or
                entity.get("entity", "").startswith(("B-PER", "I-PER", "B-ORG", "I-ORG"))
                for entity in entities
            )
            result["data"] = {
                "pii_detected": detected,
                "entities": entities
            }
        
        return result
    
    async def detect_toxicity(self, text: str) -> Dict:
        payload = {"inputs": text}
        result = await self._make_request(self.models["toxicity"], payload)
        
        if result["success"] and result["data"]:
            scores = result["data"]
            if isinstance(scores, list) and len(scores) > 0:
                toxic_score = 0.0
                for item in scores[0]:
                    if item.get("label", "").lower() in ["toxic", "toxicity"]:
                        toxic_score = item.get("score", 0.0)
                        break
                result["data"] = {"toxicity_score": toxic_score}
            else:
                result["data"] = {"toxicity_score": 0.0}
        
        return result
    
    async def get_embeddings(self, text: str) -> Dict:
        payload = {"inputs": text}
        result = await self._make_request(self.models["embeddings"], payload)
        
        if result["success"] and result["data"]:
            result["data"] = {"embeddings": result["data"]}
        
        return result
    
    async def check_hallucination(self, premise: str, hypothesis: str) -> Dict:
        payload = {"inputs": {"sentence1": premise, "sentence2": hypothesis}}
        result = await self._make_request(self.models["hallucination"], payload)
        
        if result["success"] and result["data"]:
            scores = result["data"]
            if isinstance(scores, list) and len(scores) > 0:
                entailment_score = 0.0
                for item in scores:
                    if item.get("label", "").lower() == "entailment":
                        entailment_score = item.get("score", 0.0)
                        break
                hallucination_score = 1.0 - entailment_score
                result["data"] = {"hallucination_score": hallucination_score}
            else:
                result["data"] = {"hallucination_score": 0.5}
        
        return result
