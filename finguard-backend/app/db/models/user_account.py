from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class UserAccount(Base):
    __tablename__ = "user_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="ANALYST", index=True)  # ADMIN, ANALYST
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
