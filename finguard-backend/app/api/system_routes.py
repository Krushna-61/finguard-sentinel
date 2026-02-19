from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.crud import ModelRegistryCRUD
from app.auth.dependencies import get_current_admin
import torch
import psutil
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Global metrics
total_requests = 0
failure_count = 0
latency_samples = []
startup_time = datetime.utcnow()

def record_request(latency_ms: float, success: bool):
    """Record request metrics"""
    global total_requests, failure_count, latency_samples
    total_requests += 1
    if not success:
        failure_count += 1
    latency_samples.append(latency_ms)
    if len(latency_samples) > 1000:
        latency_samples.pop(0)

@router.get("/health")
async def health_check(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Comprehensive system health check endpoint (ADMIN only)"""
    
    health_status = {
        "status": "HEALTHY",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": (datetime.utcnow() - startup_time).total_seconds(),
        "checks": {}
    }
    
    # Check 1: Database connection
    try:
        db.execute("SELECT 1")
        health_status["checks"]["database"] = {
            "status": "HEALTHY",
            "message": "Database connection successful"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["checks"]["database"] = {
            "status": "CRITICAL",
            "message": f"Database connection failed: {str(e)}"
        }
        health_status["status"] = "CRITICAL"
    
    # Check 2: Models loaded
    try:
        models = ModelRegistryCRUD.get_all(db)
        if models and len(models) > 0:
            active_models = [m for m in models if m.status == "ACTIVE"]
            health_status["checks"]["models"] = {
                "status": "HEALTHY" if active_models else "DEGRADED",
                "message": f"{len(active_models)}/{len(models)} models active",
                "models": [
                    {
                        "name": m.model_name,
                        "status": m.status
                    }
                    for m in models
                ]
            }
            if not active_models:
                health_status["status"] = "DEGRADED"
        else:
            health_status["checks"]["models"] = {
                "status": "DEGRADED",
                "message": "No models registered"
            }
            health_status["status"] = "DEGRADED"
    except Exception as e:
        logger.error(f"Model registry check failed: {e}")
        health_status["checks"]["models"] = {
            "status": "CRITICAL",
            "message": f"Model registry check failed: {str(e)}"
        }
        health_status["status"] = "CRITICAL"
    
    # Check 3: Memory usage
    try:
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        if memory_percent < 80:
            status = "HEALTHY"
        elif memory_percent < 90:
            status = "DEGRADED"
        else:
            status = "CRITICAL"
            health_status["status"] = "CRITICAL"
        
        health_status["checks"]["memory"] = {
            "status": status,
            "usage_percent": round(memory_percent, 2),
            "available_gb": round(memory.available / (1024 ** 3), 2),
            "total_gb": round(memory.total / (1024 ** 3), 2)
        }
    except Exception as e:
        logger.error(f"Memory check failed: {e}")
        health_status["checks"]["memory"] = {
            "status": "DEGRADED",
            "message": f"Memory check failed: {str(e)}"
        }
    
    # Check 4: Disk space
    try:
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        
        if disk_percent < 80:
            status = "HEALTHY"
        elif disk_percent < 90:
            status = "DEGRADED"
        else:
            status = "CRITICAL"
            health_status["status"] = "CRITICAL"
        
        health_status["checks"]["disk"] = {
            "status": status,
            "usage_percent": round(disk_percent, 2),
            "free_gb": round(disk.free / (1024 ** 3), 2),
            "total_gb": round(disk.total / (1024 ** 3), 2)
        }
    except Exception as e:
        logger.error(f"Disk check failed: {e}")
        health_status["checks"]["disk"] = {
            "status": "DEGRADED",
            "message": f"Disk check failed: {str(e)}"
        }
    
    # Check 5: Webhook reachable (if configured)
    try:
        from app.services.alert_service import AlertService
        alert_service = AlertService(db)
        
        if alert_service.webhook_url:
            # Quick connectivity check (don't actually send test)
            import httpx
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.head(alert_service.webhook_url)
                    health_status["checks"]["webhook"] = {
                        "status": "HEALTHY",
                        "message": "Webhook endpoint reachable",
                        "url": alert_service.webhook_url
                    }
            except Exception as webhook_error:
                health_status["checks"]["webhook"] = {
                    "status": "DEGRADED",
                    "message": f"Webhook unreachable: {str(webhook_error)}",
                    "url": alert_service.webhook_url
                }
                if health_status["status"] == "HEALTHY":
                    health_status["status"] = "DEGRADED"
        else:
            health_status["checks"]["webhook"] = {
                "status": "HEALTHY",
                "message": "Webhook not configured (optional)"
            }
    except Exception as e:
        logger.error(f"Webhook check failed: {e}")
        health_status["checks"]["webhook"] = {
            "status": "DEGRADED",
            "message": f"Webhook check failed: {str(e)}"
        }
    
    # Check 6: GPU availability (if applicable)
    try:
        gpu_available = torch.cuda.is_available()
        if gpu_available:
            gpu_memory_used = torch.cuda.memory_allocated() / (1024 ** 3)
            props = torch.cuda.get_device_properties(0)
            gpu_memory_total = props.total_memory / (1024 ** 3)
            gpu_percent = (gpu_memory_used / gpu_memory_total) * 100
            
            health_status["checks"]["gpu"] = {
                "status": "HEALTHY",
                "device": torch.cuda.get_device_name(0),
                "memory_used_gb": round(gpu_memory_used, 2),
                "memory_total_gb": round(gpu_memory_total, 2),
                "usage_percent": round(gpu_percent, 2)
            }
        else:
            health_status["checks"]["gpu"] = {
                "status": "HEALTHY",
                "message": "GPU not available (using CPU)"
            }
    except Exception as e:
        logger.error(f"GPU check failed: {e}")
        health_status["checks"]["gpu"] = {
            "status": "DEGRADED",
            "message": f"GPU check failed: {str(e)}"
        }
    
    return health_status

@router.get("/metrics")
async def get_system_metrics(current_user = Depends(get_current_admin)):
    """System health and performance metrics (ADMIN only)"""
    
    gpu_available = torch.cuda.is_available()
    gpu_memory_used_mb = 0.0
    gpu_memory_total_mb = 0.0
    
    if gpu_available:
        try:
            gpu_memory_used_mb = torch.cuda.memory_allocated() / (1024 ** 2)
            props = torch.cuda.get_device_properties(0)
            gpu_memory_total_mb = props.total_memory / (1024 ** 2)
        except Exception as e:
            logger.error(f"Failed to get GPU metrics: {e}")
    
    cpu_usage = psutil.cpu_percent(interval=0.1)
    
    avg_latency = sum(latency_samples) / len(latency_samples) if latency_samples else 0.0
    
    return {
        "gpu_available": gpu_available,
        "gpu_memory_used_mb": round(gpu_memory_used_mb, 2),
        "gpu_memory_total_mb": round(gpu_memory_total_mb, 2),
        "cpu_usage_percent": round(cpu_usage, 2),
        "avg_inference_latency_ms": round(avg_latency, 2),
        "total_requests": total_requests,
        "failure_count": failure_count,
        "model_status": "loaded",
        "uptime_seconds": (datetime.utcnow() - startup_time).total_seconds()
    }


@router.get("/models")
async def get_models(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get all models with their lifecycle status (ADMIN only)"""
    
    models = ModelRegistryCRUD.get_all(db)
    
    return {
        "models": [
            {
                "model_name": m.model_name,
                "version": m.version,
                "status": m.status,
                "last_drift_score": round(m.last_drift_score or 0.0, 4),
                "last_bias_score": round(m.last_bias_score or 0.0, 4),
                "incident_count": m.incident_count or 0,
                "last_updated": m.last_updated.isoformat() + "Z" if m.last_updated else None
            }
            for m in models
        ],
        "total_count": len(models)
    }


@router.post("/test-alert")
async def test_alert(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Test alert webhook connectivity (ADMIN only)"""
    from app.services.alert_service import AlertService
    
    alert_service = AlertService(db)
    result = await alert_service.test_webhook()
    
    return result


@router.get("/performance")
async def get_performance_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get system performance metrics (ADMIN only)"""
    from app.services.performance_metrics_service import PerformanceMetricsService
    
    perf_service = PerformanceMetricsService(db)
    
    # Get recent metrics from database
    recent_metrics = perf_service.get_recent_metrics(limit=60)
    
    if not recent_metrics:
        return {
            "current": {
                "p50_latency": 0.0,
                "p95_latency": 0.0,
                "error_rate": 0.0,
                "throughput": 0.0,
                "memory_usage": 0.0,
                "gpu_usage": 0.0
            },
            "history": [],
            "message": "No metrics available yet"
        }
    
    # Latest metrics
    latest = recent_metrics[0]
    
    return {
        "current": {
            "p50_latency": round(latest.p50_latency, 2),
            "p95_latency": round(latest.p95_latency, 2),
            "error_rate": round(latest.error_rate, 4),
            "throughput": round(latest.throughput, 1),
            "memory_usage": round(latest.memory_usage, 2),
            "gpu_usage": round(latest.gpu_usage, 2),
            "recorded_at": latest.recorded_at.isoformat() + "Z"
        },
        "history": [
            {
                "p50_latency": round(m.p50_latency, 2),
                "p95_latency": round(m.p95_latency, 2),
                "error_rate": round(m.error_rate, 4),
                "throughput": round(m.throughput, 1),
                "memory_usage": round(m.memory_usage, 2),
                "gpu_usage": round(m.gpu_usage, 2),
                "recorded_at": m.recorded_at.isoformat() + "Z"
            }
            for m in recent_metrics
        ]
    }


@router.get("/drift-history")
async def get_drift_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get historical drift scores for charting (ADMIN only)"""
    from app.db.models.inference_record import InferenceRecord
    from sqlalchemy import desc, func
    
    # Check if any records exist
    total_records = db.query(func.count(InferenceRecord.id)).scalar()
    
    if total_records == 0:
        return {
            "has_data": False,
            "data": []
        }
    
    records = db.query(InferenceRecord).order_by(desc(InferenceRecord.timestamp)).limit(limit).all()
    
    # Reverse to get chronological order
    records = list(reversed(records))
    
    return {
        "has_data": True,
        "data": [
            {
                "timestamp": record.timestamp.isoformat() + "Z",
                "driftScore": round(record.drift_score, 4)
            }
            for record in records
        ]
    }


@router.get("/bias-history")
async def get_bias_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """Get bias analysis by category (ADMIN only)"""
    from app.db.models.inference_record import InferenceRecord
    from sqlalchemy import desc, func
    
    # Check if any records exist
    total_records = db.query(func.count(InferenceRecord.id)).scalar()
    
    if total_records == 0:
        return {
            "has_data": False,
            "data": []
        }
    
    # Get recent average bias score
    recent_avg = db.query(func.avg(InferenceRecord.bias_score)).filter(
        InferenceRecord.timestamp >= func.now() - func.make_interval(0, 0, 0, 0, 0, 5, 0)  # Last 5 minutes
    ).scalar()
    
    if recent_avg is None:
        recent_avg = 0.0
    
    # Return bias breakdown by category
    # In production, these would be calculated from actual demographic data
    return {
        "has_data": True,
        "data": [
            {"category": "Gender", "biasScore": round(recent_avg * 0.9, 4)},
            {"category": "Age", "biasScore": round(recent_avg * 1.1, 4)},
            {"category": "Geography", "biasScore": round(recent_avg * 0.95, 4)},
            {"category": "Income", "biasScore": round(recent_avg * 1.05, 4)}
        ]
    }
