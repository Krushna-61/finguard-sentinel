"""API Key Authentication Middleware"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.settings import settings
import logging

logger = logging.getLogger(__name__)

class APIKeyMiddleware(BaseHTTPMiddleware):
    """Middleware to validate API key for protected endpoints"""
    
    EXCLUDED_PATHS = ["/docs", "/redoc", "/openapi.json", "/api/system/health", "/"]
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Check for API key
        api_key = request.headers.get("X-API-KEY")
        
        if not api_key:
            logger.warning(f"Missing API key for {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing API key. Provide X-API-KEY header."}
            )
        
        # Validate API key
        if api_key != settings.finguard_api_key:
            logger.warning(f"Invalid API key attempt for {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid API key"}
            )
        
        return await call_next(request)
