"""Risk engine tests"""
import pytest
from app.services.risk_engine import RiskEngine


class TestRiskEngine:
    """Test risk engine calculations"""
    
    def test_low_risk_scenario(self):
        """Test low risk calculation"""
        engine = RiskEngine()
        
        result = engine.calculate_composite_risk(
            pii_detected=False,
            toxicity_score=0.01,
            bias_score=0.02,
            drift_score=0.05,
            total_latency_ms=200.0,
            hallucination_score=0.03,
            inference_success=True
        )
        
        assert result["tier"] == "LOW"
        assert result["composite_score"] < 25
        assert len(result["triggered_rules"]) == 0
    
    def test_high_risk_pii_detected(self):
        """Test high risk when PII detected"""
        engine = RiskEngine()
        
        result = engine.calculate_composite_risk(
            pii_detected=True,
            toxicity_score=0.05,
            bias_score=0.05,
            drift_score=0.05,
            total_latency_ms=300.0,
            hallucination_score=0.05,
            inference_success=True
        )
        
        assert result["tier"] in ["HIGH", "CRITICAL"]
        assert "PII detected" in " ".join(result["triggered_rules"])
    
    def test_critical_risk_pii_and_bias(self):
        """Test critical risk with PII and high bias"""
        engine = RiskEngine()
        
        result = engine.calculate_composite_risk(
            pii_detected=True,
            toxicity_score=0.1,
            bias_score=0.35,  # Above critical threshold
            drift_score=0.2,
            total_latency_ms=500.0,
            hallucination_score=0.1,
            inference_success=True
        )
        
        assert result["tier"] == "CRITICAL"
        assert "PII + high bias" in " ".join(result["triggered_rules"])
    
    def test_latency_risk_calculation(self):
        """Test latency risk points"""
        engine = RiskEngine()
        
        # Low latency
        assert engine.calculate_latency_risk(300.0) == 0.0
        
        # Medium latency
        assert engine.calculate_latency_risk(600.0) == 5.0
        
        # High latency
        assert engine.calculate_latency_risk(1200.0) == 10.0
        
        # Very high latency
        assert engine.calculate_latency_risk(2000.0) == 15.0
    
    def test_composite_score_capped_at_100(self):
        """Test that composite score never exceeds 100"""
        engine = RiskEngine()
        
        result = engine.calculate_composite_risk(
            pii_detected=True,
            toxicity_score=1.0,
            bias_score=1.0,
            drift_score=1.0,
            total_latency_ms=5000.0,
            hallucination_score=1.0,
            inference_success=False
        )
        
        assert result["composite_score"] <= 100.0
    
    def test_inference_failure_penalty(self):
        """Test inference failure adds penalty"""
        engine = RiskEngine()
        
        result_success = engine.calculate_composite_risk(
            pii_detected=False,
            toxicity_score=0.1,
            bias_score=0.1,
            drift_score=0.1,
            total_latency_ms=300.0,
            hallucination_score=0.1,
            inference_success=True
        )
        
        result_failure = engine.calculate_composite_risk(
            pii_detected=False,
            toxicity_score=0.1,
            bias_score=0.1,
            drift_score=0.1,
            total_latency_ms=300.0,
            hallucination_score=0.1,
            inference_success=False
        )
        
        assert result_failure["composite_score"] > result_success["composite_score"]
        assert "Inference failure" in " ".join(result_failure["triggered_rules"])
    
    def test_breakdown_components(self):
        """Test breakdown contains all components"""
        engine = RiskEngine()
        
        result = engine.calculate_composite_risk(
            pii_detected=True,
            toxicity_score=0.2,
            bias_score=0.15,
            drift_score=0.1,
            total_latency_ms=600.0,
            hallucination_score=0.12,
            inference_success=True
        )
        
        breakdown = result["breakdown"]
        assert "pii" in breakdown
        assert "toxicity" in breakdown
        assert "bias" in breakdown
        assert "drift" in breakdown
        assert "hallucination" in breakdown
        assert "latency" in breakdown
        
        # All values should be numeric
        for value in breakdown.values():
            assert isinstance(value, (int, float))
