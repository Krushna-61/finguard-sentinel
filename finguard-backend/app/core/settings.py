from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # HuggingFace API settings
    hf_api_token: str
    hf_timeout: int = 10
    hf_max_retries: int = 2
    hf_failure_threshold: int = 3
    
    # Local model settings
    use_local_models: bool = True
    model_device: str = "cuda"
    
    # Database URL
    database_url: Optional[str] = None
    
    # Security
    finguard_api_key: str = "dev-key-12345"
    
    # JWT Authentication
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours
    
    # Alerting
    alert_webhook_url: Optional[str] = None
    
    # Rate limiting
    rate_limit_per_minute: int = 100
    
    # Runtime configuration
    env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()
