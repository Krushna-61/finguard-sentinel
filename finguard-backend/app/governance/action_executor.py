"""Action Executor for governance policy enforcement"""
from sqlalchemy.orm import Session
from typing import Dict, Optional
import logging
import re

logger = logging.getLogger(__name__)


class ActionExecutor:
    """Executes governance actions based on policy decisions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def execute_action(self, action: str, inference_id: str, metadata: Dict) -> Dict:
        """Execute a governance action"""
        action_map = {
            "BLOCK": self.block_response,
            "REDACT": self.redact_output,
            "FLAG": self.flag_inference,
            "DEGRADE_MODEL": self.update_model_status,
            "ALERT": self.create_alert
        }
        
        action_func = action_map.get(action)
        if not action_func:
            logger.warning(f"Unknown action: {action}")
            return {"success": False, "message": f"Unknown action: {action}"}
        
        try:
            result = action_func(inference_id, metadata)
            self.log_governance_event(inference_id, action, metadata, result)
            return result
        except Exception as e:
            logger.error(f"Error executing action {action}: {e}")
            return {"success": False, "message": str(e)}
    
    def redact_output(self, inference_id: str, metadata: Dict) -> Dict:
        """Redact PII from output"""
        logger.info(f"Redacting PII for inference {inference_id}")
        
        # In a real implementation, this would:
        # 1. Retrieve the inference output
        # 2. Apply PII redaction patterns
        # 3. Update the stored output
        # 4. Mark as redacted in metadata
        
        redaction_patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
            "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'
        }
        
        return {
            "success": True,
            "action": "REDACT",
            "message": "PII redacted from output",
            "redaction_applied": True,
            "patterns_matched": list(redaction_patterns.keys())
        }
    
    def block_response(self, inference_id: str, metadata: Dict) -> Dict:
        """Block inference response from being returned"""
        logger.warning(f"Blocking response for inference {inference_id}")
        
        # Mark inference as blocked in database
        from app.db.models.inference_record import InferenceRecord
        
        inference = self.db.query(InferenceRecord).filter(
            InferenceRecord.id == inference_id
        ).first()
        
        if inference:
            # Update triggered_rules to mark as blocked
            rules = inference.triggered_rules or {}
            rules["blocked"] = True
            rules["block_reason"] = metadata.get("message", "Policy violation")
            inference.triggered_rules = rules
            self.db.commit()
        
        return {
            "success": True,
            "action": "BLOCK",
            "message": "Response blocked due to policy violation",
            "blocked": True,
            "reason": metadata.get("message", "Policy violation")
        }
    
    def update_model_status(self, inference_id: str, metadata: Dict) -> Dict:
        """Update model status based on drift/bias"""
        logger.warning(f"Updating model status for inference {inference_id}")
        
        from app.db.models.model_registry import ModelRegistry as ModelRegistryModel
        
        drift_score = metadata.get("drift_score", 0.0)
        bias_score = metadata.get("bias_score", 0.0)
        
        # Determine new status
        if drift_score > 1.2 or bias_score > 0.7:
            new_status = "RETRAIN_REQUIRED"
        elif drift_score > 0.8 or bias_score > 0.5:
            new_status = "DEGRADED"
        else:
            new_status = "ACTIVE"
        
        # Update all models (in real system, would target specific model)
        models = self.db.query(ModelRegistryModel).all()
        updated_count = 0
        
        for model in models:
            if model.status != new_status:
                model.status = new_status
                model.last_drift_score = drift_score
                model.last_bias_score = bias_score
                model.incident_count = (model.incident_count or 0) + 1
                updated_count += 1
        
        if updated_count > 0:
            self.db.commit()
        
        return {
            "success": True,
            "action": "DEGRADE_MODEL",
            "message": f"Model status updated to {new_status}",
            "new_status": new_status,
            "models_updated": updated_count,
            "drift_score": drift_score,
            "bias_score": bias_score
        }
    
    def create_alert(self, inference_id: str, metadata: Dict) -> Dict:
        """Create alert for critical issues"""
        logger.critical(f"Creating alert for inference {inference_id}")
        
        from app.db.models import Alert
        
        alert = Alert(
            event_type=metadata.get("rule_name", "UNKNOWN"),
            payload={
                "inference_id": str(inference_id),
                "severity": metadata.get("severity", "HIGH"),
                "message": metadata.get("message", "Alert triggered"),
                "metadata": metadata
            },
            delivered=False
        )
        
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        
        return {
            "success": True,
            "action": "ALERT",
            "message": "Alert created",
            "alert_id": str(alert.id),
            "severity": metadata.get("severity", "HIGH")
        }
    
    def flag_inference(self, inference_id: str, metadata: Dict) -> Dict:
        """Flag inference for review"""
        logger.info(f"Flagging inference {inference_id} for review")
        
        from app.db.models.inference_record import InferenceRecord
        
        inference = self.db.query(InferenceRecord).filter(
            InferenceRecord.id == inference_id
        ).first()
        
        if inference:
            rules = inference.triggered_rules or {}
            rules["flagged"] = True
            rules["flag_reason"] = metadata.get("message", "Requires review")
            rules["flag_severity"] = metadata.get("severity", "MEDIUM")
            inference.triggered_rules = rules
            self.db.commit()
        
        return {
            "success": True,
            "action": "FLAG",
            "message": "Inference flagged for review",
            "flagged": True,
            "severity": metadata.get("severity", "MEDIUM")
        }
    
    def log_governance_event(
        self,
        inference_id: str,
        action: str,
        metadata: Dict,
        result: Dict
    ):
        """Log governance event to database"""
        from app.db.models import GovernanceEvent
        
        try:
            event = GovernanceEvent(
                inference_id=inference_id,
                event_type=action,
                severity=metadata.get("severity", "MEDIUM"),
                action_taken=action,
                event_metadata={
                    "rule_name": metadata.get("rule_name"),
                    "message": metadata.get("message"),
                    "result": result,
                    "original_metadata": metadata
                }
            )
            
            self.db.add(event)
            self.db.commit()
            logger.info(f"Governance event logged: {action} for inference {inference_id}")
        except Exception as e:
            logger.error(f"Failed to log governance event: {e}")
            # Don't fail the action if logging fails
