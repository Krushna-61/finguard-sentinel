"""Explainability Service for Governance Decisions"""
from sqlalchemy.orm import Session
from app.db.crud import InferenceRecordCRUD, ModelRegistryCRUD
from app.db.models.inference_record import InferenceRecord
import logging

logger = logging.getLogger(__name__)

class ExplainabilityService:
    """Provides detailed explanations for governance decisions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def explain_inference(self, inference_id: str) -> dict:
        """
        Generate comprehensive explanation for an inference decision.
        Returns detailed breakdown of risk factors and governance actions.
        """
        # Get inference record
        inference = self.db.query(InferenceRecord).filter(
            InferenceRecord.id == inference_id
        ).first()
        
        if not inference:
            return {"error": "Inference record not found"}
        
        # Extract triggered rules and breakdown
        triggered_rules_data = inference.triggered_rules or {}
        triggered_rules = triggered_rules_data.get("rules", [])
        breakdown = triggered_rules_data.get("breakdown", {})
        
        # Calculate weighted components
        weighted_components = self._calculate_weighted_components(breakdown)
        
        # Determine dominant risk factor
        dominant_risk_factor = self._determine_dominant_risk(weighted_components)
        
        # Get model status
        model_status = self._get_model_status()
        
        # Generate rule trace
        rule_trace = self._generate_rule_trace(triggered_rules, inference)
        
        return {
            "inference_id": str(inference.id),
            "composite_score": round(inference.composite_score, 4),
            "tier": inference.tier,
            "weighted_components": weighted_components,
            "dominant_risk_factor": dominant_risk_factor,
            "triggered_rules": triggered_rules,
            "rule_trace": rule_trace,
            "model_status": model_status,
            "timestamp": inference.timestamp.isoformat() + "Z",
            "metrics": {
                "pii_detected": inference.pii_detected,
                "drift_score": round(inference.drift_score, 4),
                "bias_score": round(inference.bias_score, 4),
                "toxicity_score": round(inference.toxicity_score, 4),
                "hallucination_score": round(inference.hallucination_score, 4),
                "latency_ms": round(inference.latency_ms, 2)
            }
        }
    
    def _calculate_weighted_components(self, breakdown: dict) -> dict:
        """Calculate weighted contribution of each risk component"""
        if not breakdown:
            return {}
        
        weighted = {}
        for component, value in breakdown.items():
            # Each component's weighted contribution
            weighted[component] = {
                "raw_score": round(value, 4),
                "contribution_percent": round(value * 100, 2)
            }
        
        return weighted
    
    def _determine_dominant_risk(self, weighted_components: dict) -> dict:
        """Identify the dominant risk factor dynamically"""
        if not weighted_components:
            return {"factor": "none", "score": 0.0}
        
        # Find component with highest contribution
        dominant = max(
            weighted_components.items(),
            key=lambda x: x[1]["raw_score"]
        )
        
        return {
            "factor": dominant[0],
            "score": dominant[1]["raw_score"],
            "contribution_percent": dominant[1]["contribution_percent"]
        }
    
    def _generate_rule_trace(self, triggered_rules: list, inference: InferenceRecord) -> list:
        """Generate detailed trace of rule evaluations"""
        trace = []
        
        for rule in triggered_rules:
            rule_name = rule.get("rule", "unknown")
            severity = rule.get("severity", "UNKNOWN")
            action = rule.get("action", "NONE")
            
            # Build explanation based on rule type
            explanation = self._build_rule_explanation(
                rule_name, 
                severity, 
                action,
                inference
            )
            
            trace.append({
                "rule": rule_name,
                "triggered": True,
                "severity": severity,
                "action": action,
                "explanation": explanation
            })
        
        return trace
    
    def _build_rule_explanation(
        self, 
        rule_name: str, 
        severity: str, 
        action: str,
        inference: InferenceRecord
    ) -> str:
        """Build human-readable explanation for a rule"""
        explanations = {
            "pii_detection": f"PII detected in input. Action: {action}. Severity: {severity}.",
            "drift_threshold": f"Model drift score ({inference.drift_score:.3f}) exceeded threshold. "
                             f"Action: {action}. Severity: {severity}.",
            "bias_threshold": f"Bias score ({inference.bias_score:.3f}) exceeded threshold. "
                            f"Action: {action}. Severity: {severity}.",
            "toxicity_threshold": f"Toxicity score ({inference.toxicity_score:.3f}) exceeded threshold. "
                                f"Action: {action}. Severity: {severity}.",
            "hallucination_threshold": f"Hallucination score ({inference.hallucination_score:.3f}) exceeded threshold. "
                                     f"Action: {action}. Severity: {severity}.",
            "latency_threshold": f"Inference latency ({inference.latency_ms:.2f}ms) exceeded threshold. "
                               f"Action: {action}. Severity: {severity}."
        }
        
        return explanations.get(
            rule_name, 
            f"Rule {rule_name} triggered with severity {severity}. Action: {action}."
        )
    
    def _get_model_status(self) -> dict:
        """Get current status of all models"""
        models = ModelRegistryCRUD.get_all(self.db)
        
        return {
            "models": [
                {
                    "name": m.model_name,
                    "status": m.status,
                    "last_drift": round(m.last_drift_score or 0.0, 4),
                    "last_bias": round(m.last_bias_score or 0.0, 4),
                    "incident_count": m.incident_count or 0
                }
                for m in models
            ]
        }
