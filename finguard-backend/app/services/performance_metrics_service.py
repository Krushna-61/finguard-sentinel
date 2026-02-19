"""System Performance Metrics Collection Service"""
from sqlalchemy.orm import Session
from app.db.crud import SystemMetricCRUD, InferenceRecordCRUD
import psutil
import torch
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class PerformanceMetricsService:
    """Collects and persists system performance metrics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def collect_and_persist_metrics(self):
        """
        Collect current system metrics and persist to database.
        Should be called every 60 seconds.
        """
        try:
            # Get latency metrics from recent inferences
            latency_metrics = self._calculate_latency_metrics()
            
            # Get error rate
            error_rate = self._calculate_error_rate()
            
            # Get throughput (requests per minute)
            throughput = self._calculate_throughput()
            
            # Get memory usage
            memory_usage = self._get_memory_usage()
            
            # Get GPU usage if available
            gpu_usage = self._get_gpu_usage()
            
            # Persist to database
            metric_record = SystemMetricCRUD.create(
                db=self.db,
                p50_latency=latency_metrics["p50"],
                p95_latency=latency_metrics["p95"],
                error_rate=error_rate,
                throughput=throughput,
                memory_usage=memory_usage,
                gpu_usage=gpu_usage
            )
            
            logger.info(
                f"Performance metrics collected - "
                f"P50: {latency_metrics['p50']:.2f}ms, "
                f"P95: {latency_metrics['p95']:.2f}ms, "
                f"Error Rate: {error_rate:.2%}, "
                f"Throughput: {throughput:.1f} req/min"
            )
            
            return metric_record
            
        except Exception as e:
            logger.error(f"Failed to collect performance metrics: {e}")
            return None
    
    def _calculate_latency_metrics(self) -> dict:
        """Calculate P50 and P95 latency from recent inferences"""
        # Get last 100 inferences
        recent = InferenceRecordCRUD.get_recent(self.db, limit=100)
        
        if not recent:
            return {"p50": 0.0, "p95": 0.0}
        
        latencies = [r.latency_ms for r in recent if r.latency_ms]
        
        if not latencies:
            return {"p50": 0.0, "p95": 0.0}
        
        p50 = float(np.percentile(latencies, 50))
        p95 = float(np.percentile(latencies, 95))
        
        return {"p50": p50, "p95": p95}
    
    def _calculate_error_rate(self) -> float:
        """Calculate error rate from recent inferences"""
        # Get last 100 inferences
        recent = InferenceRecordCRUD.get_recent(self.db, limit=100)
        
        if not recent:
            return 0.0
        
        # Count inferences with CRITICAL tier as errors
        error_count = sum(1 for r in recent if r.tier == "CRITICAL")
        
        return error_count / len(recent) if recent else 0.0
    
    def _calculate_throughput(self) -> float:
        """Calculate throughput (requests per minute)"""
        # Get inferences from last minute
        one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
        
        recent = InferenceRecordCRUD.get_recent(self.db, limit=1000)
        
        # Count inferences in last minute
        recent_count = sum(
            1 for r in recent 
            if r.timestamp >= one_minute_ago
        )
        
        return float(recent_count)
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage percentage"""
        try:
            memory = psutil.virtual_memory()
            return float(memory.percent)
        except Exception as e:
            logger.warning(f"Failed to get memory usage: {e}")
            return 0.0
    
    def _get_gpu_usage(self) -> float:
        """Get GPU memory usage percentage if CUDA available"""
        try:
            if torch.cuda.is_available():
                gpu_memory_used = torch.cuda.memory_allocated() / (1024 ** 3)  # GB
                props = torch.cuda.get_device_properties(0)
                gpu_memory_total = props.total_memory / (1024 ** 3)  # GB
                
                return float((gpu_memory_used / gpu_memory_total) * 100)
            else:
                return 0.0
        except Exception as e:
            logger.warning(f"Failed to get GPU usage: {e}")
            return 0.0
    
    def get_recent_metrics(self, limit: int = 60) -> list:
        """Get recent performance metrics from database"""
        return SystemMetricCRUD.get_recent(self.db, limit=limit)
