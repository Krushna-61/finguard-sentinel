"""Rule Registry for governance policy evaluation"""
from typing import Dict, List, Callable
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class RuleResult:
    """Result of a rule evaluation"""
    triggered: bool
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    action: str  # BLOCK, REDACT, FLAG, DEGRADE_MODEL, ALERT
    rule_name: str
    message: str
    metadata: Dict = None


class RuleRegistry:
    """Registry of governance rules that evaluate inference results"""
    
    def __init__(self):
        self.rules: Dict[str, Callable] = {}
        self._register_default_rules()
    
    def _register_default_rules(self):
        """Register all default governance rules"""
        self.register_rule("pii_detection", self._rule_pii_detection)
        self.register_rule("drift_threshold", self._rule_drift_threshold)
        self.register_rule("bias_threshold", self._rule_bias_threshold)
        self.register_rule("latency_threshold", self._rule_latency_threshold)
        self.register_rule("hallucination_threshold", self._rule_hallucination_threshold)
        self.register_rule("toxicity_threshold", self._rule_toxicity_threshold)
        self.register_rule("composite_risk", self._rule_composite_risk)
    
    def register_rule(self, name: str, rule_func: Callable):
        """Register a new rule"""
        self.rules[name] = rule_func
        logger.info(f"Registered rule: {name}")
    
    def evaluate_all(self, inference_data: Dict) -> List[RuleResult]:
        """Evaluate all rules against inference data"""
        results = []
        
        for rule_name, rule_func in self.rules.items():
            try:
                result = rule_func(inference_data)
                if result and result.triggered:
                    results.append(result)
                    logger.info(f"Rule triggered: {rule_name} - {result.severity}")
            except Exception as e:
                logger.error(f"Error evaluating rule {rule_name}: {e}")
        
        return results
    
    # ==================== RULE IMPLEMENTATIONS ====================
    
    def _rule_pii_detection(self, data: Dict) -> RuleResult:
        """Rule: PII detected in input or output"""
        pii_detected = data.get("pii_detected", False)
        
        if pii_detected:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="REDACT",
                rule_name="pii_detection",
                message="PII detected in inference data",
                metadata={"pii_detected": True}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="pii_detection",
            message="No PII detected"
        )
    
    def _rule_drift_threshold(self, data: Dict) -> RuleResult:
        """Rule: Model drift exceeds acceptable threshold"""
        drift_score = data.get("drift_score", 0.0)
        
        # Critical: drift > 1.2 (model needs retraining)
        if drift_score > 1.2:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="DEGRADE_MODEL",
                rule_name="drift_threshold",
                message=f"Critical drift detected: {drift_score:.3f} > 1.2",
                metadata={"drift_score": drift_score, "threshold": 1.2}
            )
        
        # High: drift > 0.8 (model degraded)
        elif drift_score > 0.8:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="DEGRADE_MODEL",
                rule_name="drift_threshold",
                message=f"High drift detected: {drift_score:.3f} > 0.8",
                metadata={"drift_score": drift_score, "threshold": 0.8}
            )
        
        # Medium: drift > 0.5
        elif drift_score > 0.5:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="drift_threshold",
                message=f"Moderate drift detected: {drift_score:.3f} > 0.5",
                metadata={"drift_score": drift_score, "threshold": 0.5}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="drift_threshold",
            message="Drift within acceptable range"
        )
    
    def _rule_bias_threshold(self, data: Dict) -> RuleResult:
        """Rule: Bias score exceeds acceptable threshold"""
        bias_score = data.get("bias_score", 0.0)
        
        # Critical: bias > 0.7
        if bias_score > 0.7:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="BLOCK",
                rule_name="bias_threshold",
                message=f"Critical bias detected: {bias_score:.3f} > 0.7",
                metadata={"bias_score": bias_score, "threshold": 0.7}
            )
        
        # High: bias > 0.5
        elif bias_score > 0.5:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="FLAG",
                rule_name="bias_threshold",
                message=f"High bias detected: {bias_score:.3f} > 0.5",
                metadata={"bias_score": bias_score, "threshold": 0.5}
            )
        
        # Medium: bias > 0.3
        elif bias_score > 0.3:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="bias_threshold",
                message=f"Moderate bias detected: {bias_score:.3f} > 0.3",
                metadata={"bias_score": bias_score, "threshold": 0.3}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="bias_threshold",
            message="Bias within acceptable range"
        )
    
    def _rule_latency_threshold(self, data: Dict) -> RuleResult:
        """Rule: Inference latency exceeds SLA"""
        latency_ms = data.get("latency_ms", 0.0)
        
        # Critical: > 2000ms
        if latency_ms > 2000:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="ALERT",
                rule_name="latency_threshold",
                message=f"Critical latency: {latency_ms:.0f}ms > 2000ms",
                metadata={"latency_ms": latency_ms, "threshold": 2000}
            )
        
        # High: > 1000ms
        elif latency_ms > 1000:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="ALERT",
                rule_name="latency_threshold",
                message=f"High latency: {latency_ms:.0f}ms > 1000ms",
                metadata={"latency_ms": latency_ms, "threshold": 1000}
            )
        
        # Medium: > 500ms
        elif latency_ms > 500:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="latency_threshold",
                message=f"Moderate latency: {latency_ms:.0f}ms > 500ms",
                metadata={"latency_ms": latency_ms, "threshold": 500}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="latency_threshold",
            message="Latency within SLA"
        )
    
    def _rule_hallucination_threshold(self, data: Dict) -> RuleResult:
        """Rule: Hallucination score exceeds threshold"""
        hallucination_score = data.get("hallucination_score", 0.0)
        
        # Critical: > 0.8
        if hallucination_score > 0.8:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="BLOCK",
                rule_name="hallucination_threshold",
                message=f"Critical hallucination risk: {hallucination_score:.3f} > 0.8",
                metadata={"hallucination_score": hallucination_score, "threshold": 0.8}
            )
        
        # High: > 0.6
        elif hallucination_score > 0.6:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="FLAG",
                rule_name="hallucination_threshold",
                message=f"High hallucination risk: {hallucination_score:.3f} > 0.6",
                metadata={"hallucination_score": hallucination_score, "threshold": 0.6}
            )
        
        # Medium: > 0.4
        elif hallucination_score > 0.4:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="hallucination_threshold",
                message=f"Moderate hallucination risk: {hallucination_score:.3f} > 0.4",
                metadata={"hallucination_score": hallucination_score, "threshold": 0.4}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="hallucination_threshold",
            message="Hallucination risk within acceptable range"
        )
    
    def _rule_toxicity_threshold(self, data: Dict) -> RuleResult:
        """Rule: Toxicity score exceeds threshold"""
        toxicity_score = data.get("toxicity_score", 0.0)
        
        # Critical: > 0.8
        if toxicity_score > 0.8:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="BLOCK",
                rule_name="toxicity_threshold",
                message=f"Critical toxicity detected: {toxicity_score:.3f} > 0.8",
                metadata={"toxicity_score": toxicity_score, "threshold": 0.8}
            )
        
        # High: > 0.5
        elif toxicity_score > 0.5:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="FLAG",
                rule_name="toxicity_threshold",
                message=f"High toxicity detected: {toxicity_score:.3f} > 0.5",
                metadata={"toxicity_score": toxicity_score, "threshold": 0.5}
            )
        
        # Medium: > 0.3
        elif toxicity_score > 0.3:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="toxicity_threshold",
                message=f"Moderate toxicity detected: {toxicity_score:.3f} > 0.3",
                metadata={"toxicity_score": toxicity_score, "threshold": 0.3}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="toxicity_threshold",
            message="Toxicity within acceptable range"
        )
    
    def _rule_composite_risk(self, data: Dict) -> RuleResult:
        """Rule: Composite risk score triggers governance action"""
        composite_score = data.get("composite_score", 0.0)
        tier = data.get("tier", "LOW")
        
        # CRITICAL tier always triggers
        if tier == "CRITICAL" or composite_score >= 75:
            return RuleResult(
                triggered=True,
                severity="CRITICAL",
                action="ALERT",
                rule_name="composite_risk",
                message=f"Critical risk tier: {tier} (score: {composite_score:.1f})",
                metadata={"composite_score": composite_score, "tier": tier}
            )
        
        # HIGH tier
        elif tier == "HIGH" or composite_score >= 50:
            return RuleResult(
                triggered=True,
                severity="HIGH",
                action="FLAG",
                rule_name="composite_risk",
                message=f"High risk tier: {tier} (score: {composite_score:.1f})",
                metadata={"composite_score": composite_score, "tier": tier}
            )
        
        # MEDIUM tier
        elif tier == "MEDIUM" or composite_score >= 25:
            return RuleResult(
                triggered=True,
                severity="MEDIUM",
                action="FLAG",
                rule_name="composite_risk",
                message=f"Medium risk tier: {tier} (score: {composite_score:.1f})",
                metadata={"composite_score": composite_score, "tier": tier}
            )
        
        return RuleResult(
            triggered=False,
            severity="LOW",
            action="FLAG",
            rule_name="composite_risk",
            message="Risk within acceptable range"
        )
