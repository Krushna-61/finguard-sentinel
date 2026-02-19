from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.crud import InferenceRecordCRUD
from app.auth.dependencies import get_current_analyst_or_admin
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check():
    """ML service health check"""
    return {"status": "healthy", "service": "ml_observability"}

@router.get("/observability")
async def get_ml_observability(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_analyst_or_admin)
):
    """Get ML observability data derived from database inference history (ANALYST or ADMIN)"""
    
    recent = InferenceRecordCRUD.get_recent(db, limit=50)
    
    if not recent:
        return {
            "metrics": {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0
            },
            "drift": [],
            "bias": []
        }
    
    # Compute metrics from stored history
    avg_drift = sum(r.drift_score for r in recent) / len(recent)
    avg_bias = sum(r.bias_score for r in recent) / len(recent)
    
    # Simulate degradation based on drift and bias
    accuracy = max(0.75, 0.95 - avg_drift * 0.5)
    precision = max(0.70, 0.92 - avg_bias * 0.3)
    recall = max(0.70, 0.91 - avg_drift * 0.2)
    f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    
    # Drift trend from stored records
    drift_trend = [
        {
            "timestamp": r.timestamp.isoformat() + "Z",
            "drift_score": round(r.drift_score, 4)
        }
        for r in recent
    ]
    
    # Bias categories derived from bias_score
    bias_categories = [
        {"category": "gender", "bias_score": round(avg_bias * 0.35, 4)},
        {"category": "race", "bias_score": round(avg_bias * 0.25, 4)},
        {"category": "age", "bias_score": round(avg_bias * 0.20, 4)},
        {"category": "religion", "bias_score": round(avg_bias * 0.20, 4)}
    ]
    
    return {
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1_score, 4)
        },
        "drift": drift_trend,
        "bias": bias_categories
    }
