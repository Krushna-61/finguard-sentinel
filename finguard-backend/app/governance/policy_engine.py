"""Policy Engine for AI Governance"""
from sqlalchemy.orm import Session
from typing import Dict, List
import logging

from app.governance.rule_registry import RuleRegistry, RuleResult
from app.governance.action_executor import ActionExecutor

logger = logging.getLogger(__name__)


class PolicyEngine:
    """
    Central policy engine that:
    1. Evaluates inference results against governance rules
    2. Aggregates triggered rules
    3. Overrides risk tier if necessary
    4. Executes enforcement actions
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.rule_registry = RuleRegistry()
        self.action_executor = ActionExecutor(db)
    
    def evaluate_inference(self, inference_record: Dict) -> Dict:
        """
        Evaluate inference against all governance rules
        
        Args:
            inference_record: Dict containing inference data
            
        Returns:
            Dict with evaluation results and actions taken
        """
        inference_id = inference_record.get("id")
        logger.info(f"Evaluating inference {inference_id} against governance policies")
        
        # Evaluate all rules
        triggered_rules = self.rule_registry.evaluate_all(inference_record)
        
        # Aggregate results
        aggregated = self._aggregate_rules(triggered_rules)
        
        # Determine if risk tier override is needed
        original_tier = inference_record.get("tier", "LOW")
        override_tier = self._determine_tier_override(triggered_rules, original_tier)
        
        # Execute actions for triggered rules
        actions_taken = self._execute_actions(inference_id, triggered_rules)
        
        # Prepare result
        result = {
            "inference_id": inference_id,
            "original_tier": original_tier,
            "final_tier": override_tier,
            "tier_overridden": override_tier != original_tier,
            "rules_evaluated": len(self.rule_registry.rules),
            "rules_triggered": len(triggered_rules),
            "triggered_rules": [
                {
                    "rule_name": r.rule_name,
                    "severity": r.severity,
                    "action": r.action,
                    "message": r.message
                }
                for r in triggered_rules
            ],
            "aggregated_severity": aggregated["max_severity"],
            "actions_taken": actions_taken,
            "policy_compliant": aggregated["max_severity"] not in ["CRITICAL"],
            "requires_review": any(r.action in ["FLAG", "BLOCK"] for r in triggered_rules)
        }
        
        logger.info(
            f"Policy evaluation complete for {inference_id}: "
            f"{len(triggered_rules)} rules triggered, "
            f"tier: {original_tier} -> {override_tier}"
        )
        
        return result
    
    def _aggregate_rules(self, triggered_rules: List[RuleResult]) -> Dict:
        """Aggregate triggered rules to determine overall severity"""
        if not triggered_rules:
            return {
                "max_severity": "LOW",
                "severity_counts": {},
                "action_counts": {}
            }
        
        severity_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        
        max_severity = max(
            (r.severity for r in triggered_rules),
            key=lambda s: severity_order.get(s, 0)
        )
        
        severity_counts = {}
        action_counts = {}
        
        for rule in triggered_rules:
            severity_counts[rule.severity] = severity_counts.get(rule.severity, 0) + 1
            action_counts[rule.action] = action_counts.get(rule.action, 0) + 1
        
        return {
            "max_severity": max_severity,
            "severity_counts": severity_counts,
            "action_counts": action_counts
        }
    
    def _determine_tier_override(
        self,
        triggered_rules: List[RuleResult],
        original_tier: str
    ) -> str:
        """
        Determine if risk tier should be overridden based on triggered rules
        
        Policy:
        - Any CRITICAL rule -> CRITICAL tier
        - Multiple HIGH rules -> escalate to CRITICAL
        - Any HIGH rule -> minimum HIGH tier
        - Multiple MEDIUM rules -> escalate to HIGH
        """
        if not triggered_rules:
            return original_tier
        
        severity_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
        
        # Count severities
        critical_count = sum(1 for r in triggered_rules if r.severity == "CRITICAL")
        high_count = sum(1 for r in triggered_rules if r.severity == "HIGH")
        medium_count = sum(1 for r in triggered_rules if r.severity == "MEDIUM")
        
        # Escalation logic
        if critical_count > 0:
            return "CRITICAL"
        
        if high_count >= 2:
            return "CRITICAL"
        
        if high_count >= 1:
            # Ensure at least HIGH tier
            if severity_order.get(original_tier, 0) < severity_order["HIGH"]:
                return "HIGH"
        
        if medium_count >= 3:
            return "HIGH"
        
        if medium_count >= 1:
            # Ensure at least MEDIUM tier
            if severity_order.get(original_tier, 0) < severity_order["MEDIUM"]:
                return "MEDIUM"
        
        return original_tier
    
    def _execute_actions(
        self,
        inference_id: str,
        triggered_rules: List[RuleResult]
    ) -> List[Dict]:
        """Execute actions for all triggered rules"""
        actions_taken = []
        
        # Group actions by priority (BLOCK > REDACT > DEGRADE_MODEL > ALERT > FLAG)
        action_priority = {
            "BLOCK": 5,
            "REDACT": 4,
            "DEGRADE_MODEL": 3,
            "ALERT": 2,
            "FLAG": 1
        }
        
        # Sort rules by action priority
        sorted_rules = sorted(
            triggered_rules,
            key=lambda r: action_priority.get(r.action, 0),
            reverse=True
        )
        
        # Execute actions (skip duplicates)
        executed_actions = set()
        
        for rule in sorted_rules:
            action = rule.action
            
            # Skip if action already executed
            if action in executed_actions:
                continue
            
            # Execute action
            result = self.action_executor.execute_action(
                action=action,
                inference_id=inference_id,
                metadata={
                    "rule_name": rule.rule_name,
                    "severity": rule.severity,
                    "message": rule.message,
                    **(rule.metadata or {})
                }
            )
            
            actions_taken.append({
                "action": action,
                "rule": rule.rule_name,
                "result": result
            })
            
            executed_actions.add(action)
            
            # If BLOCK action succeeds, stop executing further actions
            if action == "BLOCK" and result.get("success"):
                logger.warning(f"Inference {inference_id} blocked, stopping action execution")
                break
        
        return actions_taken
    
    def get_policy_summary(self) -> Dict:
        """Get summary of registered policies"""
        return {
            "total_rules": len(self.rule_registry.rules),
            "rules": list(self.rule_registry.rules.keys()),
            "action_types": ["BLOCK", "REDACT", "FLAG", "DEGRADE_MODEL", "ALERT"],
            "severity_levels": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        }
