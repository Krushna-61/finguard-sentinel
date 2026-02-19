from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.crud import InferenceRecordCRUD
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check():
    """LLM service health check"""
    return {"status": "healthy", "service": "llm_monitoring"}

@router.get("/metrics")
async def get_llm_metrics(db: Session = Depends(get_db)):
    """Get LLM monitoring metrics from latest database inference record"""
    
    latest = InferenceRecordCRUD.get_latest(db)
    
    if not latest:
        return {
            "latency": 0,
            "token_usage": 0,
            "hallucination_score": 0.0,
            "toxicity_score": 0.0,
            "pii_detected": False
        }
    
    return {
        "latency": int(latest.latency_ms),
        "token_usage": latest.token_usage,
        "hallucination_score": round(latest.hallucination_score * 100, 2),
        "toxicity_score": round(latest.toxicity_score * 100, 2),
        "pii_detected": latest.pii_detected
    }
