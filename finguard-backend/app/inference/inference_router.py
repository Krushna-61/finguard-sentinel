from typing import Dict
from app.inference.hf_provider import HFProvider
from app.inference.local_provider import LocalProvider
from app.core.settings import settings
import logging

logger = logging.getLogger(__name__)

class InferenceRouter:
    
    def __init__(self):
        self.hf_provider = HFProvider()
        self.local_provider = None
        self.use_local = settings.use_local_models
        
        if self.use_local:
            try:
                self.local_provider = LocalProvider()
                logger.info("InferenceRouter initialized with local models")
            except Exception as e:
                logger.error(f"Failed to initialize LocalProvider: {e}")
                logger.warning("Falling back to HF API only")
                self.use_local = False
    
    async def detect_pii(self, text: str) -> Dict:
        if self.use_local and self.local_provider:
            result = await self.local_provider.detect_pii(text)
            if result["success"]:
                return result
            logger.warning(f"Local PII detection failed: {result.get('error')}. Falling back to HF API.")
        
        return await self.hf_provider.detect_pii(text)
    
    async def detect_toxicity(self, text: str) -> Dict:
        if self.use_local and self.local_provider:
            result = await self.local_provider.detect_toxicity(text)
            if result["success"]:
                return result
            logger.warning(f"Local toxicity detection failed: {result.get('error')}. Falling back to HF API.")
        
        return await self.hf_provider.detect_toxicity(text)
    
    async def get_embeddings(self, text: str) -> Dict:
        if self.use_local and self.local_provider:
            result = await self.local_provider.get_embeddings(text)
            if result["success"]:
                return result
            logger.warning(f"Local embeddings failed: {result.get('error')}. Falling back to HF API.")
        
        return await self.hf_provider.get_embeddings(text)
    
    async def check_hallucination(self, premise: str, hypothesis: str) -> Dict:
        if self.use_local and self.local_provider:
            result = await self.local_provider.check_hallucination(premise, hypothesis)
            if result["success"]:
                return result
            logger.warning(f"Local hallucination check failed: {result.get('error')}. Falling back to HF API.")
        
        return await self.hf_provider.check_hallucination(premise, hypothesis)

inference_router = InferenceRouter()
