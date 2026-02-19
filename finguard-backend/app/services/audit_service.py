import hashlib
from datetime import datetime
from typing import Dict, List
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

class AuditService:
    """In-memory audit logging system"""
    
    def __init__(self):
        self.audit_log: List[Dict] = []
        self.max_entries = 1000
    
    def log_inference(
        self,
        input_text: str,
        composite_score: float,
        tier: str,
        triggered_rules: List[str],
        total_latency: float,
        success: bool,
        model_versions: Dict = None
    ):
        """Log inference event to audit trail"""
        
        input_hash = hashlib.sha256(input_text.encode()).hexdigest()
        
        entry = {
            "id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "input_hash": input_hash,
            "model_versions": model_versions or {"ner": "dslim/bert-base-NER", "toxicity": "unitary/toxic-bert"},
            "composite_score": composite_score,
            "tier": tier,
            "triggered_rules": triggered_rules,
            "total_latency": round(total_latency, 2),
            "success_flag": success
        }
        
        self.audit_log.append(entry)
        
        # Maintain max size
        if len(self.audit_log) > self.max_entries:
            self.audit_log.pop(0)
        
        logger.debug(f"Audit entry logged: {entry['id']}")
    
    def get_logs(self, limit: int = 100) -> Dict:
        """Retrieve audit logs"""
        return {
            "entries": self.audit_log[-limit:],
            "total_count": len(self.audit_log)
        }
    
    def clear_logs(self):
        """Clear all audit logs"""
        self.audit_log = []
        logger.info("Audit logs cleared")

# Global singleton
audit_service = AuditService()
