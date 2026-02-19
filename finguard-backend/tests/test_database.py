"""Database CRUD tests"""
import pytest
from app.db.crud import (
    InferenceRecordCRUD,
    RiskThresholdCRUD,
    AuditEventCRUD,
    ModelRegistryCRUD
)


class TestInferenceRecordCRUD:
    """Test inference record CRUD operations"""
    
    def test_create_inference_record(self, db_session):
        """Test creating inference record"""
        record = InferenceRecordCRUD.create(
            db=db_session,
            input_hash="test_hash_123",
            token_usage=100,
            latency_ms=250.5,
            drift_score=0.15,
            bias_score=0.08,
            toxicity_score=0.02,
            hallucination_score=0.05,
            composite_score=25.5,
            tier="LOW",
            pii_detected=False,
            triggered_rules={"rules": [], "breakdown": {}}
        )
        
        assert record.id is not None
        assert record.input_hash == "test_hash_123"
        assert record.token_usage == 100
        assert record.composite_score == 25.5
        assert record.tier == "LOW"
    
    def test_get_latest_inference(self, db_session):
        """Test getting latest inference record"""
        # Create multiple records
        for i in range(3):
            InferenceRecordCRUD.create(
                db=db_session,
                input_hash=f"hash_{i}",
                token_usage=100,
                latency_ms=200.0,
                drift_score=0.1,
                bias_score=0.1,
                toxicity_score=0.1,
                hallucination_score=0.1,
                composite_score=20.0,
                tier="LOW",
                pii_detected=False,
                triggered_rules={}
            )
        
        latest = InferenceRecordCRUD.get_latest(db_session)
        assert latest is not None
        assert latest.input_hash == "hash_2"
    
    def test_get_aggregates(self, db_session):
        """Test aggregate statistics"""
        # Create test records
        for i in range(5):
            InferenceRecordCRUD.create(
                db=db_session,
                input_hash=f"hash_{i}",
                token_usage=100,
                latency_ms=200.0 + i * 10,
                drift_score=0.1 + i * 0.01,
                bias_score=0.1,
                toxicity_score=0.1,
                hallucination_score=0.1,
                composite_score=20.0,
                tier="LOW",
                pii_detected=False,
                triggered_rules={}
            )
        
        aggregates = InferenceRecordCRUD.get_aggregates(db_session)
        assert aggregates["total_count"] == 5
        assert aggregates["avg_latency"] > 0
        assert aggregates["avg_drift"] > 0


class TestRiskThresholdCRUD:
    """Test risk threshold CRUD operations"""
    
    def test_create_default_threshold(self, db_session):
        """Test creating default risk threshold"""
        threshold = RiskThresholdCRUD.create_default(db_session)
        
        assert threshold.id is not None
        assert threshold.pii_weight == 0.40
        assert threshold.toxicity_weight == 0.25
        assert threshold.latency_threshold_ms == 800.0
    
    def test_ensure_exists(self, db_session):
        """Test ensure threshold exists"""
        threshold1 = RiskThresholdCRUD.ensure_exists(db_session)
        threshold2 = RiskThresholdCRUD.ensure_exists(db_session)
        
        # Should return same threshold
        assert threshold1.id == threshold2.id


class TestAuditEventCRUD:
    """Test audit event CRUD operations"""
    
    def test_create_audit_event(self, db_session):
        """Test creating audit event"""
        event = AuditEventCRUD.create(
            db=db_session,
            event_type="INFERENCE",
            severity="INFO",
            metadata={"test": "data"}
        )
        
        assert event.id is not None
        assert event.event_type == "INFERENCE"
        assert event.severity == "INFO"
        assert event.event_metadata["test"] == "data"
    
    def test_get_paginated_events(self, db_session):
        """Test paginated audit events"""
        # Create multiple events
        for i in range(25):
            AuditEventCRUD.create(
                db=db_session,
                event_type="TEST",
                severity="INFO",
                metadata={"index": i}
            )
        
        page1 = AuditEventCRUD.get_paginated(db_session, page=1, limit=10)
        assert len(page1) == 10
        
        page2 = AuditEventCRUD.get_paginated(db_session, page=2, limit=10)
        assert len(page2) == 10
        
        total = AuditEventCRUD.count(db_session)
        assert total == 25


class TestModelRegistryCRUD:
    """Test model registry CRUD operations"""
    
    def test_create_model_entry(self, db_session):
        """Test creating model registry entry"""
        model = ModelRegistryCRUD.create(
            db=db_session,
            model_name="test-model",
            model_version="1.0",
            device="cpu",
            status="loaded",
            memory_usage_mb=512.0
        )
        
        assert model.id is not None
        assert model.model_name == "test-model"
        assert model.status == "loaded"
    
    def test_get_by_name(self, db_session):
        """Test getting model by name"""
        ModelRegistryCRUD.create(
            db=db_session,
            model_name="test-model",
            model_version="1.0",
            device="cpu",
            status="loaded",
            memory_usage_mb=512.0
        )
        
        model = ModelRegistryCRUD.get_by_name(db_session, "test-model")
        assert model is not None
        assert model.model_name == "test-model"
