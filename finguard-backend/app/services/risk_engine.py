from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.db.crud import RiskThresholdCRUD

class RiskEngine:
    """Risk Engine 2.0 with database-driven weights and dominance logic"""
    
    def __init__(self, db: Session = None):
        """Initialize with optional database session for weight loading"""
        self.db = db
        self._load_weights()
    
    def _load_weights(self):
        """Load weights from database or use defaults"""
        # Set contribution scores and thresholds (always needed)
        self.drift_contribution = 30
        self.bias_contribution = 25
        self.hallucination_contribution = 20
        self.hallucination_threshold = 0.6
        self.bias_critical_threshold = 0.3
        
        if self.db:
            try:
                threshold = RiskThresholdCRUD.get_active(self.db)
                if threshold:
                    self.pii_weight = threshold.pii_weight
                    self.toxicity_weight = threshold.toxicity_weight
                    self.bias_weight = threshold.bias_weight
                    self.drift_weight = threshold.drift_weight
                    self.hallucination_weight = threshold.hallucination_weight
                    self.latency_weight = threshold.latency_weight
                    self.latency_threshold_ms = threshold.latency_threshold_ms
                    return
            except Exception:
                pass
        
        # Fallback to defaults
        self.pii_weight = 0.40
        self.toxicity_weight = 0.25
        self.bias_weight = 0.25
        self.drift_weight = 0.20
        self.hallucination_weight = 0.20
        self.latency_weight = 0.15
        self.latency_threshold_ms = 800.0
    
    def calculate_latency_risk(self, total_latency_ms: float) -> float:
        """
        Calculate bounded latency risk score
        
        Args:
            total_latency_ms: Wall-clock latency in milliseconds
            
        Returns:
            Risk points (0-15)
        """
        if total_latency_ms < 400:
            return 0.0
        elif total_latency_ms < 800:
            return 5.0
        elif total_latency_ms < 1500:
            return 10.0
        else:
            return 15.0
    
    def calculate_composite_risk(
        self,
        pii_detected: bool,
        toxicity_score: float,
        bias_score: float,
        drift_score: float,
        total_latency_ms: float,
        hallucination_score: Optional[float] = None,
        inference_success: bool = True
    ) -> Dict:
        """
        Calculate composite risk with dominance rules and explainability
        
        Args:
            drift_score: Normalized drift score [0,1]
            bias_score: Normalized bias score [0,1]
            total_latency_ms: Wall-clock end-to-end latency
        
        Returns:
            {
                composite_score: float (0-100),
                tier: str (LOW/MEDIUM/HIGH/CRITICAL),
                breakdown: dict,
                triggered_rules: list[str]
            }
        """
        triggered_rules = []
        
        # Component scores
        pii_component = self.pii_weight * 100 if pii_detected else 0.0
        drift_component = drift_score * self.drift_contribution
        bias_component = bias_score * self.bias_contribution
        hallucination_component = (hallucination_score or 0.0) * self.hallucination_contribution
        latency_risk_points = self.calculate_latency_risk(total_latency_ms)
        
        if total_latency_ms > self.latency_threshold_ms:
            triggered_rules.append(f"Operational latency exceeded threshold: {total_latency_ms:.0f}ms > {self.latency_threshold_ms}ms")
        
        # Deterministic composite calculation
        total_score = pii_component + drift_component + bias_component + hallucination_component + latency_risk_points
        
        # Hallucination penalty
        if hallucination_score and hallucination_score > self.hallucination_threshold:
            triggered_rules.append(f"Hallucination risk: {hallucination_score:.2f} > {self.hallucination_threshold}")
        
        # Inference failure penalty
        if not inference_success:
            total_score += 5.0
            triggered_rules.append("Inference failure detected")
        
        # Cap at 100 and round
        composite_score = round(min(total_score, 100.0), 2)
        
        # Determine tier
        if composite_score >= 75:
            tier = "CRITICAL"
        elif composite_score >= 50:
            tier = "HIGH"
        elif composite_score >= 25:
            tier = "MEDIUM"
        else:
            tier = "LOW"
        
        # Dominance rules
        if pii_detected:
            triggered_rules.append("PII detected - enforcing minimum HIGH tier")
            if tier not in ["HIGH", "CRITICAL"]:
                tier = "HIGH"
            
            if bias_score > self.bias_critical_threshold:
                triggered_rules.append(f"PII + high bias ({bias_score:.2f}) - escalating to CRITICAL")
                tier = "CRITICAL"
        
        return {
            "composite_score": composite_score,
            "tier": tier,
            "breakdown": {
                "pii": round(pii_component, 2),
                "toxicity": round(toxicity_score * 100, 2),
                "bias": round(bias_component, 2),
                "drift": round(drift_component, 2),
                "hallucination": round(hallucination_component, 2),
                "latency": round(latency_risk_points, 2)
            },
            "triggered_rules": triggered_rules
        }
