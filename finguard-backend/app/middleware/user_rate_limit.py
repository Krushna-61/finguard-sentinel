"""User-based Rate Limiting Middleware with Role Support"""
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
from app.auth.security import verify_token
import logging

logger = logging.getLogger(__name__)

class UserRateLimitMiddleware(BaseHTTPMiddleware):
    """Production-grade user-based rate limiter with role-based limits"""
    
    # Rate limits per role
    RATE_LIMITS = {
        "ADMIN": 200,      # 200 requests/min for ADMIN
        "ANALYST": 60,     # 60 requests/min for ANALYST
        "default": 60      # 60 requests/min for unauthenticated
    }
    
    def __init__(self, app):
        super().__init__(app)
        # Store request timestamps per user
        self.request_counts = defaultdict(list)
    
    def _get_user_from_token(self, request: Request) -> tuple:
        """Extract user ID and role from JWT token"""
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return None, "default"
        
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        
        if payload is None:
            return None, "default"
        
        user_id = payload.get("sub")
        role = payload.get("role", "default")
        
        return user_id, role
    
    def _clean_old_entries(self, identifier: str, cutoff: datetime):
        """Remove request timestamps older than 1 minute"""
        self.request_counts[identifier] = [
            ts for ts in self.request_counts[identifier] if ts > cutoff
        ]
    
    def _get_rate_limit(self, role: str) -> int:
        """Get rate limit for role"""
        return self.RATE_LIMITS.get(role, self.RATE_LIMITS["default"])
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for auth endpoints
        if request.url.path.startswith("/api/auth/"):
            return await call_next(request)
        
        # Get user ID and role
        user_id, role = self._get_user_from_token(request)
        
        # Use user_id if authenticated, otherwise use IP
        identifier = user_id if user_id else request.client.host
        
        # Get rate limit for this user/role
        rate_limit = self._get_rate_limit(role)
        
        # Clean old entries
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)
        self._clean_old_entries(identifier, cutoff)
        
        # Check rate limit
        current_count = len(self.request_counts[identifier])
        
        if current_count >= rate_limit:
            logger.warning(
                f"Rate limit exceeded for {identifier} "
                f"(role: {role}, limit: {rate_limit}/min, current: {current_count})"
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Try again later.",
                    "limit": rate_limit,
                    "window": "1 minute",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Record request
        self.request_counts[identifier].append(now)
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(rate_limit - current_count - 1)
        response.headers["X-RateLimit-Reset"] = str(int((cutoff + timedelta(minutes=1)).timestamp()))
        
        return response
