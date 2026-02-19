"""Prometheus metrics middleware"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from time import time
import logging

logger = logging.getLogger(__name__)

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics"""
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.request_duration_sum = 0.0
        self.error_count = 0
    
    async def dispatch(self, request: Request, call_next):
        start_time = time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time() - start_time
        
        # Update metrics
        self.request_count += 1
        self.request_duration_sum += duration
        
        if response.status_code >= 400:
            self.error_count += 1
        
        # Add custom headers
        response.headers["X-Process-Time"] = str(duration)
        
        # Log slow requests
        if duration > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} took {duration:.2f}s",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration,
                    "status_code": response.status_code
                }
            )
        
        return response
    
    def get_metrics(self):
        """Get current metrics"""
        avg_duration = (
            self.request_duration_sum / self.request_count 
            if self.request_count > 0 
            else 0.0
        )
        
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "avg_duration_seconds": round(avg_duration, 4),
            "error_rate": round(self.error_count / self.request_count, 4) if self.request_count > 0 else 0.0
        }
