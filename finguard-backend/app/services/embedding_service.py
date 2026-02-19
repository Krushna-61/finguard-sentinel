from typing import List, Dict
import numpy as np
from app.inference.inference_router import inference_router

class EmbeddingService:
    """Service for generating embeddings and semantic analysis"""
    
    def __init__(self):
        self.embedding_dim = 384
    
    async def generate_embedding(self, text: str) -> Dict:
        """
        Generate embedding vector for text
        
        Args:
            text: Input text
            
        Returns:
            Dict with embeddings and metadata
        """
        result = await inference_router.get_embeddings(text)
        
        if not result["success"]:
            return {
                "embeddings": [0.0] * self.embedding_dim,
                "error": result["error"],
                "latency_ms": result["latency_ms"]
            }
        
        embeddings = result["data"]["embeddings"]
        if not isinstance(embeddings, list):
            embeddings = [0.0] * self.embedding_dim
        
        return {
            "embeddings": embeddings,
            "error": None,
            "latency_ms": result["latency_ms"]
        }
    
    async def compute_similarity(self, text1: str, text2: str) -> Dict:
        """
        Compute semantic similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Dict with similarity score (0-1) and metadata
        """
        emb1_result = await self.generate_embedding(text1)
        emb2_result = await self.generate_embedding(text2)
        
        if emb1_result["error"] or emb2_result["error"]:
            return {
                "similarity": 0.0,
                "error": emb1_result["error"] or emb2_result["error"],
                "latency_ms": emb1_result["latency_ms"] + emb2_result["latency_ms"]
            }
        
        similarity = self._cosine_similarity(
            emb1_result["embeddings"],
            emb2_result["embeddings"]
        )
        
        return {
            "similarity": similarity,
            "error": None,
            "latency_ms": emb1_result["latency_ms"] + emb2_result["latency_ms"]
        }
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        norm_product = np.linalg.norm(v1) * np.linalg.norm(v2)
        if norm_product == 0:
            return 0.0
        return float(np.dot(v1, v2) / norm_product)
