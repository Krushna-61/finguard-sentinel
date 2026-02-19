from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.crud import InferenceRecordCRUD, AuditEventCRUD
from app.auth.dependencies import get_current_admin
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.get("/health")
async def health_check():
    """Governance service health check"""
    return {"status": "healthy", "service": "governance"}

@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get paginated audit log entries from database (ADMIN only)"""
    
    entries = AuditEventCRUD.get_paginated(db, page=page, limit=limit)
    total_count = AuditEventCRUD.count(db)
    
    return {
        "entries": [
            {
                "id": str(entry.id),
                "timestamp": entry.timestamp.isoformat() + "Z",
                "event_type": entry.event_type,
                "severity": entry.severity,
                "metadata": entry.event_metadata
            }
            for entry in entries
        ],
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit
    }

@router.get("/risk")
async def get_governance_risk(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get current governance risk assessment from latest inference (ADMIN only)"""
    
    latest = InferenceRecordCRUD.get_latest(db)
    
    if not latest:
        return {
            "composite_score": 0.0,
            "tier": "LOW",
            "breakdown": {},
            "triggered_rules": [],
            "lastUpdated": None
        }
    
    # Extract breakdown and rules from triggered_rules JSONB
    triggered_rules_data = latest.triggered_rules or {}
    breakdown = triggered_rules_data.get("breakdown", {})
    rules = triggered_rules_data.get("rules", [])
    
    return {
        "composite_score": latest.composite_score,
        "tier": latest.tier,
        "breakdown": breakdown,
        "triggered_rules": rules,
        "lastUpdated": latest.timestamp.isoformat() + "Z"
    }


@router.get("/explain/{inference_id}")
async def explain_inference(
    inference_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get detailed explanation for a governance decision (ADMIN only).
    Returns comprehensive breakdown of risk factors and rule evaluations.
    """
    from app.services.explainability_service import ExplainabilityService
    
    explainability_service = ExplainabilityService(db)
    explanation = explainability_service.explain_inference(inference_id)
    
    if "error" in explanation:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=explanation["error"])
    
    return explanation
