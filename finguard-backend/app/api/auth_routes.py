from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.db.session import get_db
from app.db.crud import UserAccountCRUD
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user
from app.core.settings import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "ANALYST"

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account"""
    
    # Validate role
    if user_data.role not in ["ADMIN", "ANALYST"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be ADMIN or ANALYST"
        )
    
    # Check if user already exists
    existing_user = UserAccountCRUD.get_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = UserAccountCRUD.create(
        db=db,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    logger.info(f"User registered: {user.email} with role {user.role}")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        created_at=user.created_at.isoformat()
    )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and receive JWT access token"""
    
    # Get user by email (username field contains email)
    user = UserAccountCRUD.get_by_email(db, form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.jwt_expiration_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User logged in: {user.email}")
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at.isoformat()
    )
