"""Rate Limiting Middleware"""
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter"""
    
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Clean old entries
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)
        self.request_counts[client_ip] = [
            ts for ts in self.request_counts[client_ip] if ts > cutoff
        ]
        
        # Check rate limit
        if len(self.request_counts[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."}
            )
        
        # Record request
        self.request_counts[client_ip].append(now)
        
        return await call_next(request)
