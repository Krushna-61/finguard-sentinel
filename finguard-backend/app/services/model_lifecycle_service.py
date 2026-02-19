"""Model Lifecycle Management Service"""
from sqlalchemy.orm import Session
from app.db.models.model_registry import ModelRegistry
from app.db.crud import ModelRegistryCRUD
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ModelLifecycleService:
    """Manages model lifecycle based on drift/bias thresholds"""
    
    # Thresholds for model status transitions
    DRIFT_DEGRADED_THRESHOLD = 0.8
    DRIFT_RETRAIN_THRESHOLD = 1.2
    BIAS_DEGRADED_THRESHOLD = 0.8
    BIAS_RETRAIN_THRESHOLD = 1.2
    
    def __init__(self, db: Session):
        self.db = db
    
    def update_model_metrics(
        self,
        model_name: str,
        drift_score: float = None,
        bias_score: float = None,
        inference_blocked: bool = False
    ):
        """Update model metrics and status based on thresholds"""
        model = ModelRegistryCRUD.get_by_name(self.db, model_name)
        
        if not model:
            logger.warning(f"Model {model_name} not found in registry")
            return None
        
        # Update drift score
        if drift_score is not None:
            model.last_drift_score = drift_score
        
        # Update bias score
        if bias_score is not None:
            model.last_bias_score = bias_score
        
        # Increment incident count if inference was blocked
        if inference_blocked:
            model.incident_count = (model.incident_count or 0) + 1
            logger.warning(
                f"Incident count incremented for {model_name}: "
                f"{model.incident_count}"
            )
        
        # Determine new status based on thresholds
        new_status = self._determine_status(
            model.last_drift_score or 0.0,
            model.last_bias_score or 0.0
        )
        
        # Update status if changed
        if new_status != model.status:
            old_status = model.status
            model.status = new_status
            model.last_updated = datetime.utcnow()
            logger.info(
                f"Model {model_name} status changed: {old_status} -> {new_status} "
                f"(drift: {model.last_drift_score:.3f}, bias: {model.last_bias_score:.3f})"
            )
        
        self.db.commit()
        self.db.refresh(model)
        
        return model
    
    def _determine_status(self, drift_score: float, bias_score: float) -> str:
        """Determine model status based on drift and bias scores"""
        
        # Check for RETRAIN_REQUIRED (highest priority)
        if (drift_score >= self.DRIFT_RETRAIN_THRESHOLD or 
            bias_score >= self.BIAS_RETRAIN_THRESHOLD):
            return "RETRAIN_REQUIRED"
        
        # Check for DEGRADED
        if (drift_score >= self.DRIFT_DEGRADED_THRESHOLD or 
            bias_score >= self.BIAS_DEGRADED_THRESHOLD):
            return "DEGRADED"
        
        # Otherwise ACTIVE
        return "ACTIVE"
    
    def get_all_models(self):
        """Get all models with their current status"""
        return ModelRegistryCRUD.get_all(self.db)
    
    def get_model_status(self, model_name: str):
        """Get status for a specific model"""
        return ModelRegistryCRUD.get_by_name(self.db, model_name)
