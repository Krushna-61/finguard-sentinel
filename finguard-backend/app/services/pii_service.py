from typing import Dict
from app.inference.inference_router import inference_router

class PIIService:
    """Service for detecting PII in text using NER"""
    
    def __init__(self):
        self.pii_entities = ["PERSON", "ORG", "GPE", "LOC", "EMAIL", "PHONE", "SSN"]
    
    async def detect_pii(self, text: str) -> Dict:
        """
        Detect PII entities in text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dict with pii_detected flag and entities list
        """
        result = await inference_router.detect_pii(text)
        
        if not result["success"]:
            return {
                "pii_detected": False,
                "entities": [],
                "error": result["error"],
                "latency_ms": result["latency_ms"]
            }
        
        return {
            "pii_detected": result["data"]["pii_detected"],
            "entities": result["data"]["entities"],
            "error": None,
            "latency_ms": result["latency_ms"]
        }
