"""DB-backed Model Registry Service"""
from sqlalchemy.orm import Session
from app.db.models.model_registry import ModelRegistry as ModelRegistryDB
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ModelRegistryService:
    """Production-grade DB-backed model registry"""
    
    REQUIRED_MODELS = [
        {
            "model_name": "pii_detector",
            "version": "dslim/bert-base-NER",
            "status": "ACTIVE"
        },
        {
            "model_name": "toxicity_classifier",
            "version": "unitary/toxic-bert",
            "status": "ACTIVE"
        },
        {
            "model_name": "embedding_model",
            "version": "sentence-transformers/all-MiniLM-L6-v2",
            "status": "ACTIVE"
        },
        {
            "model_name": "hallucination_detector",
            "version": "facebook/bart-large-mnli",
            "status": "ACTIVE"
        },
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def initialize_registry(self):
        """Ensure required models exist in DB. Insert if missing."""
        for model_spec in self.REQUIRED_MODELS:
            existing = (
                self.db.query(ModelRegistryDB)
                .filter(ModelRegistryDB.model_name == model_spec["model_name"])
                .first()
            )
            
            if not existing:
                new_model = ModelRegistryDB(
                    model_name=model_spec["model_name"],
                    version=model_spec["version"],
                    status=model_spec["status"],
                    last_updated=datetime.utcnow()
                )
                self.db.add(new_model)
                logger.info(f"Registered model: {model_spec['model_name']}")
        
        self.db.commit()
        logger.info("Model registry initialized from database")
    
    def get_active_models(self):
        """Get all active models from DB"""
        return (
            self.db.query(ModelRegistryDB)
            .filter(ModelRegistryDB.status == "ACTIVE")
            .all()
        )
