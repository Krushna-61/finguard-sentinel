import numpy as np
from typing import List, Optional
from scipy.stats import ks_2samp
import logging

logger = logging.getLogger(__name__)

class DriftService:
    """Embedding-based drift detection engine"""
    
    def __init__(self):
        self.baseline_embeddings: List[np.ndarray] = []
        self.baseline_centroid: Optional[np.ndarray] = None
        self.max_baseline_size = 1000
    
    def update_baseline(self, embeddings: np.ndarray):
        """Add embeddings to baseline distribution"""
        if isinstance(embeddings, list):
            embeddings = np.array(embeddings)
        
        self.baseline_embeddings.append(embeddings)
        
        if len(self.baseline_embeddings) > self.max_baseline_size:
            self.baseline_embeddings.pop(0)
        
        self.baseline_centroid = np.mean(self.baseline_embeddings, axis=0)
        logger.debug(f"Baseline updated: {len(self.baseline_embeddings)} samples")
    
    def compute_drift(self, current_embeddings: np.ndarray) -> float:
        """
        Compute drift score using cosine distance and KS test
        
        Returns:
            Drift score normalized 0-1
        """
        if self.baseline_centroid is None or len(self.baseline_embeddings) == 0:
            logger.warning("No baseline available, returning zero drift")
            return 0.0
        
        if isinstance(current_embeddings, list):
            current_embeddings = np.array(current_embeddings)
        
        # Cosine distance from baseline centroid
        cosine_sim = np.dot(current_embeddings, self.baseline_centroid) / (
            np.linalg.norm(current_embeddings) * np.linalg.norm(self.baseline_centroid)
        )
        cosine_distance = 1 - cosine_sim
        
        # KS test on embedding dimensions
        baseline_flat = np.concatenate(self.baseline_embeddings)
        current_flat = current_embeddings.flatten()
        
        try:
            ks_stat, _ = ks_2samp(baseline_flat, current_flat)
        except Exception as e:
            logger.error(f"KS test failed: {e}")
            ks_stat = 0.0
        
        # Combined drift score
        drift_score = (cosine_distance * 0.6) + (ks_stat * 0.4)
        drift_score = np.clip(drift_score, 0.0, 1.0)
        
        logger.debug(f"Drift computed: cosine={cosine_distance:.3f}, ks={ks_stat:.3f}, final={drift_score:.3f}")
        
        return float(drift_score)
    
    def reset_baseline(self):
        """Clear baseline distribution"""
        self.baseline_embeddings = []
        self.baseline_centroid = None
        logger.info("Baseline reset")
