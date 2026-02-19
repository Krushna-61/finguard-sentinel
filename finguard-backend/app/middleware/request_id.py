"""Request ID Middleware for request tracking"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import request_id_var, user_id_var
from app.auth.security import verify_token
import uuid
import logging

logger = logging.getLogger(__name__)

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request_id to all requests and logs"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate or extract request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Set request_id in context
        request_id_var.set(request_id)
        
        # Extract user_id from JWT token if present
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub")
                user_id_var.set(user_id)
        
        # Process request
        response = await call_next(request)
        
        # Add request_id to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
