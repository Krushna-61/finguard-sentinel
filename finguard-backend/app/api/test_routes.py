from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.pii_service import PIIService
from app.services.toxicity_service import ToxicityService
from app.services.embedding_service import EmbeddingService
from app.services.hallucination_service import HallucinationService
from app.services.risk_engine import RiskEngine
from app.services.model_lifecycle_service import ModelLifecycleService
from app.services.drift_detection_service import DriftDetectionService
from app.api.system_routes import record_request
from app.inference.inference_router import inference_router
from app.db.session import get_db
from app.db.crud import InferenceRecordCRUD, AuditEventCRUD
from datetime import datetime
import asyncio
import time
import numpy as np
import hashlib
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

pii_service = PIIService()
toxicity_service = ToxicityService()
embedding_service = EmbeddingService()
hallucination_service = HallucinationService()

class TestRequest(BaseModel):
    text: str

def estimate_token_usage(text: str) -> int:
    """Estimate token usage from text length"""
    return max(1, int(len(text) / 4))

@router.post("/inference")
async def test_inference_pipeline(request: TestRequest, db: Session = Depends(get_db)):
    """Live inference pipeline with database persistence"""
    
    overall_start = time.perf_counter()
    text = request.text
    
    try:
        # Initialize risk engine with DB session
        risk_engine = RiskEngine(db=db)
        
        # Parallel inference execution
        inference_start = time.perf_counter()
        pii_result, toxicity_result, embedding_result, hallucination_result = await asyncio.gather(
            inference_router.detect_pii(text),
            inference_router.detect_toxicity(text),
            inference_router.get_embeddings(text),
            inference_router.check_hallucination(text, text)
        )
        inference_wall_clock_ms = (time.perf_counter() - inference_start) * 1000
        
        # Extract results
        pii_detected = pii_result.get("data", {}).get("pii_detected", False)
        toxicity_score = toxicity_result.get("data", {}).get("toxicity_score", 0.0)
        embeddings = embedding_result.get("data", {}).get("embeddings", [])
        hallucination_score = hallucination_result.get("data", {}).get("hallucination_score", 0.0)
        
        # Real drift detection using statistical methods
        embeddings_array = np.array(embeddings)
        drift_service = DriftDetectionService(db)
        drift_score = drift_service.calculate_drift(embeddings_array)
        
        # Compute bias score
        bias_score = hallucination_score * 0.4 + toxicity_score * 0.6
        
        # Estimate token usage
        token_usage = estimate_token_usage(text)
        
        # Check success
        all_successful = all([
            pii_result.get("success", False),
            toxicity_result.get("success", False),
            embedding_result.get("success", False),
            hallucination_result.get("success", False)
        ])
        
        # Risk assessment - single source of truth
        risk_assessment = risk_engine.calculate_composite_risk(
            pii_detected=pii_detected,
            toxicity_score=toxicity_score,
            bias_score=bias_score,
            drift_score=drift_score,
            total_latency_ms=inference_wall_clock_ms,
            hallucination_score=hallucination_score,
            inference_success=all_successful
        )
        
        # Compute input hash
        input_hash = hashlib.sha256(text.encode()).hexdigest()
        
        # Store in database
        inference_record = InferenceRecordCRUD.create(
            db=db,
            input_hash=input_hash,
            token_usage=token_usage,
            latency_ms=inference_wall_clock_ms,
            drift_score=drift_score,
            bias_score=bias_score,
            toxicity_score=toxicity_score,
            hallucination_score=hallucination_score,
            composite_score=risk_assessment["composite_score"],
            tier=risk_assessment["tier"],
            pii_detected=pii_detected,
            triggered_rules={
                "rules": risk_assessment["triggered_rules"],
                "breakdown": risk_assessment["breakdown"],
                "embedding": embeddings  # Store for drift calculation
            }
        )
        
        logger.info(f"Inference record created: {inference_record.id}")
        
        # Update model lifecycle based on drift/bias scores
        lifecycle_service = ModelLifecycleService(db)
        inference_blocked = risk_assessment["tier"] == "CRITICAL"
        
        # Update metrics for all models (using a generic model name for now)
        lifecycle_service.update_model_metrics(
            model_name="embedding_model",
            drift_score=drift_score,
            bias_score=bias_score,
            inference_blocked=inference_blocked
        )
        
        # Send alert for CRITICAL tier events
        if risk_assessment["tier"] == "CRITICAL":
            from app.services.alert_service import AlertService
            alert_service = AlertService(db)
            await alert_service.create_critical_alert(
                event_type="CRITICAL_INFERENCE",
                payload={
                    "inference_id": str(inference_record.id),
                    "composite_score": risk_assessment["composite_score"],
                    "tier": risk_assessment["tier"],
                    "triggered_rules": risk_assessment["triggered_rules"],
                    "input_hash": input_hash,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                },
                inference_id=str(inference_record.id)
            )
        
        # Audit logging
        AuditEventCRUD.create(
            db=db,
            event_type="INFERENCE",
            severity="INFO" if risk_assessment["tier"] in ["LOW", "MEDIUM"] else "WARNING",
            metadata={
                "input_hash": input_hash,
                "composite_score": risk_assessment["composite_score"],
                "tier": risk_assessment["tier"],
                "triggered_rules": risk_assessment["triggered_rules"],
                "latency_ms": inference_wall_clock_ms,
                "success": all_successful
            }
        )
        
        # Record metrics
        record_request(inference_wall_clock_ms, all_successful)
        
        return {
            "input_text": text,
            "inference_results": {
                "pii": {
                    "detected": pii_detected,
                    "entities_count": len(pii_result.get("data", {}).get("entities", [])),
                    "latency_ms": round(pii_result.get("latency_ms", 0), 2),
                    "error": pii_result.get("error")
                },
                "toxicity": {
                    "score": toxicity_score,
                    "latency_ms": round(toxicity_result.get("latency_ms", 0), 2),
                    "error": toxicity_result.get("error")
                },
                "embeddings": {
                    "dimension": len(embeddings),
                    "latency_ms": round(embedding_result.get("latency_ms", 0), 2),
                    "error": embedding_result.get("error")
                },
                "hallucination": {
                    "score": hallucination_score,
                    "latency_ms": round(hallucination_result.get("latency_ms", 0), 2),
                    "error": hallucination_result.get("error")
                }
            },
            "inference_wall_clock_ms": round(inference_wall_clock_ms, 2),
            "drift_score": round(drift_score, 4),
            "bias_score": round(bias_score, 4),
            "token_usage": token_usage,
            "risk_assessment": risk_assessment,
            "all_successful": all_successful,
            "record_id": str(inference_record.id)
        }
    
    except Exception as e:
        logger.error(f"Inference pipeline failed: {e}", exc_info=True)
        total_latency = (time.perf_counter() - overall_start) * 1000
        record_request(total_latency, False)
        
        # Log failure audit event
        try:
            AuditEventCRUD.create(
                db=db,
                event_type="INFERENCE",
                severity="ERROR",
                metadata={"error": str(e), "latency_ms": total_latency}
            )
        except Exception:
            pass
        
        return {
            "input_text": text,
            "error": str(e),
            "inference_wall_clock_ms": round(total_latency, 2),
            "all_successful": False
        }

