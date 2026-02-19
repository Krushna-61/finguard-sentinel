from abc import ABC, abstractmethod
from typing import Dict

class InferenceProvider(ABC):
    
    @abstractmethod
    async def detect_pii(self, text: str) -> Dict:
        pass
    
    @abstractmethod
    async def detect_toxicity(self, text: str) -> Dict:
        pass
    
    @abstractmethod
    async def get_embeddings(self, text: str) -> Dict:
        pass
    
    @abstractmethod
    async def check_hallucination(self, premise: str, hypothesis: str) -> Dict:
        pass
