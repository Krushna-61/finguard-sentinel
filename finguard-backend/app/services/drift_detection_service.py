"""Production-grade Drift Detection Service"""
from sqlalchemy.orm import Session
from app.db.crud import InferenceRecordCRUD
import numpy as np
from scipy.spatial.distance import cosine
from scipy.stats import entropy
import logging

logger = logging.getLogger(__name__)

class DriftDetectionService:
    """Real drift detection using statistical methods"""
    
    BASELINE_WINDOW_SIZE = 50  # Last 50 embeddings for baseline
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_drift(self, current_embedding: np.ndarray) -> float:
        """
        Calculate drift score using multiple statistical methods.
        Returns normalized drift score (0-1).
        """
        # Get baseline embeddings from last N inferences
        baseline_embeddings = self._get_baseline_embeddings()
        
        if len(baseline_embeddings) < 10:
            # Not enough data for reliable drift calculation
            logger.info(f"Insufficient baseline data: {len(baseline_embeddings)} embeddings")
            return 0.0
        
        # Calculate multiple drift metrics
        cosine_drift = self._calculate_cosine_drift(current_embedding, baseline_embeddings)
        kl_drift = self._calculate_kl_divergence(current_embedding, baseline_embeddings)
        psi_drift = self._calculate_psi(current_embedding, baseline_embeddings)
        
        # Weighted combination of metrics
        drift_score = (
            0.4 * cosine_drift +
            0.3 * kl_drift +
            0.3 * psi_drift
        )
        
        # Ensure bounded between 0 and 1
        drift_score = float(np.clip(drift_score, 0.0, 1.0))
        
        logger.info(
            f"Drift calculated - Cosine: {cosine_drift:.4f}, "
            f"KL: {kl_drift:.4f}, PSI: {psi_drift:.4f}, "
            f"Combined: {drift_score:.4f}"
        )
        
        return drift_score
    
    def _get_baseline_embeddings(self) -> list:
        """Get last N embeddings from database for baseline"""
        recent_records = InferenceRecordCRUD.get_recent(
            self.db, 
            limit=self.BASELINE_WINDOW_SIZE
        )
        
        embeddings = []
        for record in recent_records:
            if record.triggered_rules and isinstance(record.triggered_rules, dict):
                embedding = record.triggered_rules.get("embedding", [])
                if embedding and len(embedding) > 0:
                    embeddings.append(np.array(embedding))
        
        return embeddings
    
    def _calculate_cosine_drift(
        self, 
        current: np.ndarray, 
        baseline: list
    ) -> float:
        """Calculate mean cosine distance from baseline"""
        if len(baseline) == 0:
            return 0.0
        
        distances = []
        for base_emb in baseline:
            try:
                # Cosine distance = 1 - cosine similarity
                dist = cosine(current, base_emb)
                if not np.isnan(dist):
                    distances.append(dist)
            except Exception as e:
                logger.warning(f"Cosine calculation error: {e}")
                continue
        
        if len(distances) == 0:
            return 0.0
        
        # Mean cosine distance, normalized to 0-1
        mean_distance = np.mean(distances)
        return float(np.clip(mean_distance, 0.0, 1.0))
    
    def _calculate_kl_divergence(
        self, 
        current: np.ndarray, 
        baseline: list
    ) -> float:
        """Calculate KL divergence between current and baseline distributions"""
        if len(baseline) == 0:
            return 0.0
        
        try:
            # Convert to probability distributions
            baseline_mean = np.mean(baseline, axis=0)
            
            # Add small epsilon to avoid log(0)
            epsilon = 1e-10
            current_dist = np.abs(current) + epsilon
            baseline_dist = np.abs(baseline_mean) + epsilon
            
            # Normalize to probability distributions
            current_dist = current_dist / np.sum(current_dist)
            baseline_dist = baseline_dist / np.sum(baseline_dist)
            
            # Calculate KL divergence
            kl_div = entropy(current_dist, baseline_dist)
            
            # Normalize to 0-1 range (KL divergence is unbounded)
            # Use sigmoid-like transformation
            normalized_kl = 1 - np.exp(-kl_div / 2)
            
            return float(np.clip(normalized_kl, 0.0, 1.0))
            
        except Exception as e:
            logger.warning(f"KL divergence calculation error: {e}")
            return 0.0
    
    def _calculate_psi(
        self, 
        current: np.ndarray, 
        baseline: list
    ) -> float:
        """
        Calculate Population Stability Index (PSI).
        PSI measures distribution shift.
        """
        if len(baseline) == 0:
            return 0.0
        
        try:
            # Flatten baseline embeddings
            baseline_flat = np.concatenate(baseline)
            current_flat = current.flatten()
            
            # Create bins for histogram
            num_bins = 10
            bins = np.linspace(
                min(baseline_flat.min(), current_flat.min()),
                max(baseline_flat.max(), current_flat.max()),
                num_bins + 1
            )
            
            # Calculate histograms
            baseline_hist, _ = np.histogram(baseline_flat, bins=bins)
            current_hist, _ = np.histogram(current_flat, bins=bins)
            
            # Convert to proportions
            epsilon = 1e-10
            baseline_prop = (baseline_hist + epsilon) / (baseline_hist.sum() + epsilon * num_bins)
            current_prop = (current_hist + epsilon) / (current_hist.sum() + epsilon * num_bins)
            
            # Calculate PSI
            psi = np.sum((current_prop - baseline_prop) * np.log(current_prop / baseline_prop))
            
            # Normalize PSI to 0-1 range
            # PSI < 0.1: no significant change
            # PSI 0.1-0.25: moderate change
            # PSI > 0.25: significant change
            normalized_psi = np.clip(psi / 0.5, 0.0, 1.0)
            
            return float(normalized_psi)
            
        except Exception as e:
            logger.warning(f"PSI calculation error: {e}")
            return 0.0
