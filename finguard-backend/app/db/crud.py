"""Database CRUD operations"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional, Dict
from datetime import datetime
import hashlib
from uuid import uuid4

from app.db.models import (
    InferenceRecord,
    SystemMetrics,
    RiskThreshold,
    AuditEvent,
    ModelRegistry
)


class InferenceRecordCRUD:
    """CRUD operations for inference records"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> InferenceRecord:
        """Create new inference record"""
        record = InferenceRecord(**kwargs)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    
    @staticmethod
    def get_latest(db: Session) -> Optional[InferenceRecord]:
        """Get most recent inference record"""
        return db.query(InferenceRecord).order_by(desc(InferenceRecord.timestamp)).first()
    
    @staticmethod
    def get_recent(db: Session, limit: int = 50) -> List[InferenceRecord]:
        """Get recent inference records"""
        return db.query(InferenceRecord).order_by(desc(InferenceRecord.timestamp)).limit(limit).all()
    
    @staticmethod
    def get_paginated(db: Session, page: int = 1, limit: int = 20) -> List[InferenceRecord]:
        """Get paginated inference records"""
        offset = (page - 1) * limit
        return db.query(InferenceRecord).order_by(desc(InferenceRecord.timestamp)).offset(offset).limit(limit).all()
    
    @staticmethod
    def count(db: Session) -> int:
        """Get total count of inference records"""
        return db.query(func.count(InferenceRecord.id)).scalar()
    
    @staticmethod
    def get_aggregates(db: Session, limit: int = 100) -> Dict:
        """Get aggregate statistics"""
        records = db.query(InferenceRecord).order_by(desc(InferenceRecord.timestamp)).limit(limit).all()
        
        if not records:
            return {
                "avg_latency": 0.0,
                "avg_drift": 0.0,
                "avg_bias": 0.0,
                "avg_toxicity": 0.0,
                "avg_hallucination": 0.0,
                "total_count": 0
            }
        
        return {
            "avg_latency": sum(r.latency_ms for r in records) / len(records),
            "avg_drift": sum(r.drift_score for r in records) / len(records),
            "avg_bias": sum(r.bias_score for r in records) / len(records),
            "avg_toxicity": sum(r.toxicity_score for r in records) / len(records),
            "avg_hallucination": sum(r.hallucination_score for r in records) / len(records),
            "total_count": len(records)
        }


class SystemMetricsCRUD:
    """CRUD operations for system metrics"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> SystemMetrics:
        """Create new system metrics snapshot"""
        metrics = SystemMetrics(**kwargs)
        db.add(metrics)
        db.commit()
        db.refresh(metrics)
        return metrics
    
    @staticmethod
    def get_latest(db: Session) -> Optional[SystemMetrics]:
        """Get most recent system metrics"""
        return db.query(SystemMetrics).order_by(desc(SystemMetrics.timestamp)).first()


class RiskThresholdCRUD:
    """CRUD operations for risk thresholds"""
    
    @staticmethod
    def get_active(db: Session) -> Optional[RiskThreshold]:
        """Get active risk threshold configuration"""
        return db.query(RiskThreshold).order_by(desc(RiskThreshold.created_at)).first()
    
    @staticmethod
    def create_default(db: Session) -> RiskThreshold:
        """Create default risk threshold configuration"""
        threshold = RiskThreshold(
            pii_weight=0.40,
            toxicity_weight=0.25,
            bias_weight=0.25,
            drift_weight=0.20,
            hallucination_weight=0.20,
            latency_weight=0.15,
            latency_threshold_ms=800.0
        )
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
        return threshold
    
    @staticmethod
    def ensure_exists(db: Session) -> RiskThreshold:
        """Ensure risk threshold exists, create default if not"""
        threshold = RiskThresholdCRUD.get_active(db)
        if not threshold:
            threshold = RiskThresholdCRUD.create_default(db)
        return threshold


class AuditEventCRUD:
    """CRUD operations for audit events"""
    
    @staticmethod
    def create(db: Session, event_type: str, severity: str, metadata: Dict = None) -> AuditEvent:
        """Create new audit event"""
        event = AuditEvent(
            event_type=event_type,
            severity=severity,
            event_metadata=metadata or {}
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_paginated(db: Session, page: int = 1, limit: int = 20) -> List[AuditEvent]:
        """Get paginated audit events"""
        offset = (page - 1) * limit
        return db.query(AuditEvent).order_by(desc(AuditEvent.timestamp)).offset(offset).limit(limit).all()
    
    @staticmethod
    def count(db: Session) -> int:
        """Get total count of audit events"""
        return db.query(func.count(AuditEvent.id)).scalar()


class ModelRegistryCRUD:
    """CRUD operations for model registry"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> ModelRegistry:
        """Register a model"""
        model = ModelRegistry(**kwargs)
        db.add(model)
        db.commit()
        db.refresh(model)
        return model
    
    @staticmethod
    def get_all(db: Session) -> List[ModelRegistry]:
        """Get all registered models"""
        return db.query(ModelRegistry).order_by(desc(ModelRegistry.loaded_at)).all()
    
    @staticmethod
    def get_by_name(db: Session, model_name: str) -> Optional[ModelRegistry]:
        """Get model by name"""
        return db.query(ModelRegistry).filter(ModelRegistry.model_name == model_name).first()



class GovernanceEventCRUD:
    """CRUD operations for governance events"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> 'GovernanceEvent':
        """Create new governance event"""
        from app.db.models import GovernanceEvent
        event = GovernanceEvent(**kwargs)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    
    @staticmethod
    def get_by_inference(db: Session, inference_id: str) -> List['GovernanceEvent']:
        """Get all governance events for an inference"""
        from app.db.models import GovernanceEvent
        return db.query(GovernanceEvent).filter(
            GovernanceEvent.inference_id == inference_id
        ).order_by(desc(GovernanceEvent.timestamp)).all()
    
    @staticmethod
    def get_recent(db: Session, limit: int = 100) -> List['GovernanceEvent']:
        """Get recent governance events"""
        from app.db.models import GovernanceEvent
        return db.query(GovernanceEvent).order_by(
            desc(GovernanceEvent.timestamp)
        ).limit(limit).all()


class AlertCRUD:
    """CRUD operations for alerts"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> 'Alert':
        """Create new alert"""
        from app.db.models import Alert
        alert = Alert(**kwargs)
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert
    
    @staticmethod
    def get_undelivered(db: Session) -> List['Alert']:
        """Get all undelivered alerts"""
        from app.db.models import Alert
        return db.query(Alert).filter(Alert.delivered == False).order_by(
            Alert.timestamp
        ).all()
    
    @staticmethod
    def mark_delivered(db: Session, alert_id: str) -> bool:
        """Mark alert as delivered"""
        from app.db.models import Alert
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.delivered = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_recent(db: Session, limit: int = 50) -> List['Alert']:
        """Get recent alerts"""
        from app.db.models import Alert
        return db.query(Alert).order_by(desc(Alert.timestamp)).limit(limit).all()


class SystemMetricCRUD:
    """CRUD operations for system metrics"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> 'SystemMetric':
        """Create new system metric snapshot"""
        from app.db.models import SystemMetric
        metric = SystemMetric(**kwargs)
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric
    
    @staticmethod
    def get_latest(db: Session) -> Optional['SystemMetric']:
        """Get most recent system metric"""
        from app.db.models import SystemMetric
        return db.query(SystemMetric).order_by(
            desc(SystemMetric.recorded_at)
        ).first()
    
    @staticmethod
    def get_recent(db: Session, limit: int = 100) -> List['SystemMetric']:
        """Get recent system metrics"""
        from app.db.models import SystemMetric
        return db.query(SystemMetric).order_by(
            desc(SystemMetric.recorded_at)
        ).limit(limit).all()


class UserAccountCRUD:
    """CRUD operations for user accounts"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> 'UserAccount':
        """Create new user account"""
        from app.db.models import UserAccount
        user = UserAccount(**kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional['UserAccount']:
        """Get user by email"""
        from app.db.models import UserAccount
        return db.query(UserAccount).filter(UserAccount.email == email).first()
    
    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional['UserAccount']:
        """Get user by ID"""
        from app.db.models import UserAccount
        return db.query(UserAccount).filter(UserAccount.id == user_id).first()
    
    @staticmethod
    def get_all(db: Session) -> List['UserAccount']:
        """Get all users"""
        from app.db.models import UserAccount
        return db.query(UserAccount).all()
    
    @staticmethod
    def update_password(db: Session, user_id: str, hashed_password: str) -> bool:
        """Update user password"""
        from app.db.models import UserAccount
        user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
        if user:
            user.hashed_password = hashed_password
            db.commit()
            return True
        return False
