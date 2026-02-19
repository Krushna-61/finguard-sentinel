from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ml_routes, llm_routes, governance_routes, test_routes, system_routes, auth_routes
from app.core.settings import settings
from app.core.logging_config import setup_logging
from app.middleware.auth import APIKeyMiddleware
from app.middleware.user_rate_limit import UserRateLimitMiddleware
from app.middleware.metrics import MetricsMiddleware
from app.middleware.request_id import RequestIDMiddleware
import logging
import asyncio

# Database imports
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.crud import RiskThresholdCRUD, AuditEventCRUD, ModelRegistryCRUD

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

# Force model registration
from app.db import models

# Background task control
metrics_collection_task = None

app = FastAPI(
    title="FinGuard Sentinel API",
    version="1.0.0",
    description="Production AI Governance Backend",
    docs_url="/docs" if settings.env == "development" else None,
    redoc_url="/redoc" if settings.env == "development" else None
)

# Add request ID middleware (first, to track all requests)
app.add_middleware(RequestIDMiddleware)

# Add metrics middleware (second, to capture all requests)
metrics_middleware = MetricsMiddleware(app)
app.add_middleware(MetricsMiddleware)

# Add user-based rate limiting middleware (60 req/min per user, 200 req/min for ADMIN)
app.add_middleware(UserRateLimitMiddleware)

# Add authentication middleware (only if not in development with default key)
if settings.env == "production" or settings.finguard_api_key != "dev-key-12345":
    app.add_middleware(APIKeyMiddleware)
    logger.info("API key authentication enabled")
else:
    logger.warning("API key authentication DISABLED - development mode")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"] if settings.env == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Validate database connectivity and initialize schema"""
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'inference_records',
            'system_metrics',
            'risk_thresholds',
            'audit_events',
            'model_registry'
        ]
        
        missing = [t for t in required_tables if t not in tables]
        if missing:
            logger.error(f"Missing required tables: {missing}")
            logger.error("Run 'alembic upgrade head' to create tables")
            raise RuntimeError(f"Database schema incomplete. Missing tables: {missing}")
        
        logger.info("Database connectivity validated successfully")
        
        # Ensure risk thresholds exist
        db = SessionLocal()
        try:
            RiskThresholdCRUD.ensure_exists(db)
            logger.info("Risk thresholds initialized")
            
            # Log startup event
            AuditEventCRUD.create(
                db=db,
                event_type="STARTUP",
                severity="INFO",
                metadata={
                    "env": settings.env,
                    "use_local_models": settings.use_local_models,
                    "device": settings.model_device
                }
            )
            logger.info("Startup audit event logged")
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Database validation failed: {e}")
        raise

@app.on_event("startup")
async def preload_models():
    """Initialize model registry and preload local models if enabled"""
    global metrics_collection_task
    
    logger.info("Initializing model registry...")
    db = SessionLocal()
    try:
        from app.services.model_registry_service import ModelRegistryService
        registry_service = ModelRegistryService(db)
        registry_service.initialize_registry()
        logger.info("Model registry initialized from database")
    finally:
        db.close()
    
    if settings.use_local_models:
        try:
            logger.info("Preloading local models...")
            from app.core.model_registry import ModelRegistry
            registry = ModelRegistry()
            
            if registry.is_ready():
                logger.info("All models loaded and warmed successfully")
            else:
                logger.error("Model registry initialization failed")
        except Exception as e:
            logger.error(f"Failed to preload models: {e}")
            logger.warning("Server will continue with HF API fallback only")
    else:
        logger.info("Local models disabled, using HF API only")
    
    # Start background metrics collection task
    metrics_collection_task = asyncio.create_task(collect_metrics_periodically())
    logger.info("Started background metrics collection task")

async def collect_metrics_periodically():
    """Background task to collect performance metrics every 60 seconds"""
    while True:
        try:
            await asyncio.sleep(60)  # Wait 60 seconds
            
            db = SessionLocal()
            try:
                from app.services.performance_metrics_service import PerformanceMetricsService
                perf_service = PerformanceMetricsService(db)
                perf_service.collect_and_persist_metrics()
            finally:
                db.close()
                
        except asyncio.CancelledError:
            logger.info("Metrics collection task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in metrics collection task: {e}")

@app.on_event("shutdown")
def on_shutdown():
    """Log shutdown event and stop background tasks"""
    global metrics_collection_task
    
    # Cancel metrics collection task
    if metrics_collection_task:
        metrics_collection_task.cancel()
        logger.info("Metrics collection task cancelled")
    
    try:
        db = SessionLocal()
        try:
            AuditEventCRUD.create(
                db=db,
                event_type="SHUTDOWN",
                severity="INFO",
                metadata={"env": settings.env}
            )
            logger.info("Shutdown audit event logged")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to log shutdown event: {e}")

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Prometheus-style metrics endpoint"""
    return metrics_middleware.get_metrics()

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ml_routes.router, prefix="/api/ml", tags=["ML Observability"])
app.include_router(llm_routes.router, prefix="/api/llm", tags=["LLM Monitoring"])
app.include_router(governance_routes.router, prefix="/api/governance", tags=["Governance"])
app.include_router(test_routes.router, prefix="/api/test", tags=["Testing"])
app.include_router(system_routes.router, prefix="/api/system", tags=["System"])

@app.get("/")
async def root():
    return {
        "message": "FinGuard Sentinel API",
        "status": "running",
        "version": "1.0.0",
        "environment": settings.env
    }
