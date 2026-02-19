from typing import Dict
from app.inference.inference_router import inference_router

class HallucinationService:
    """Service for detecting hallucinations using NLI"""
    
    def __init__(self):
        self.entailment_threshold = 0.5
    
    async def detect_hallucination(self, premise: str, hypothesis: str) -> Dict:
        """
        Detect hallucination by checking entailment between premise and hypothesis
        
        Args:
            premise: Source/context text
            hypothesis: Generated text to verify
            
        Returns:
            Dict with hallucination_score (0-1, higher = more likely hallucination) and metadata
        """
        result = await inference_router.check_hallucination(premise, hypothesis)
        
        if not result["success"]:
            return {
                "hallucination_score": 0.5,
                "error": result["error"],
                "latency_ms": result["latency_ms"]
            }
        
        return {
            "hallucination_score": result["data"]["hallucination_score"],
            "error": None,
            "latency_ms": result["latency_ms"]
        }
