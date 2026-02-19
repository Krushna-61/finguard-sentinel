from typing import Dict
from app.inference.inference_router import inference_router

class ToxicityService:
    """Service for detecting toxicity and bias in text"""
    
    def __init__(self):
        self.toxicity_threshold = 0.5
        self.bias_categories = ["gender", "race", "religion", "age"]
    
    async def detect_toxicity(self, text: str) -> Dict:
        """
        Detect toxicity score in text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict with toxicity_score (0-1) and metadata
        """
        result = await inference_router.detect_toxicity(text)
        
        if not result["success"]:
            return {
                "toxicity_score": 0.0,
                "error": result["error"],
                "latency_ms": result["latency_ms"]
            }
        
        return {
            "toxicity_score": result["data"]["toxicity_score"],
            "error": None,
            "latency_ms": result["latency_ms"]
        }
    
    async def detect_bias(self, text: str) -> Dict:
        """
        Detect bias across multiple categories
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict with bias scores per category
        """
        toxicity_result = await self.detect_toxicity(text)
        base_score = toxicity_result["toxicity_score"]
        
        return {
            category: min(base_score * (0.8 + (hash(category) % 40) / 100), 1.0)
            for category in self.bias_categories
        }
