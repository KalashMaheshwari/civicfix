import re
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.core.deps import get_current_user
from backend.app.db.postgres_direct import DirectDB
from backend.app.schemas.complaint import ProfileResponse

router = APIRouter()


def validate_strong_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(value) > 128:
        raise ValueError("Password cannot exceed 128 characters.")
    if not re.search(r'[A-Z]', value):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")
    if not re.search(r'[a-z]', value):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")
    if not re.search(r'\d', value):
        raise ValueError("Password must contain at least one number (0-9).")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+/\\~`]', value):
        raise ValueError("Password must contain at least one special character (e.g. !@#$%^&*).")
    return value


def validate_email_address(value: str) -> str:
    cleaned = value.strip()
    if not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', cleaned):
        raise ValueError("Please enter a valid email address.")
    return cleaned


class CitizenRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    phone: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_email_address(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_strong_password(v)


class OfficialRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    department: str = Field(..., description="e.g. Roads & Works, Sanitation, Electricity")
    official_badge_id: str = Field(..., description="Official Government Badge / Employee ID")
    phone: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return validate_email_address(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_strong_password(v)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ProfileResponse


@router.post("/register-citizen", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_citizen(payload: CitizenRegisterRequest):
    """
    Register a new Citizen account.
    """
    existing = DirectDB.get_profile_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    user = DirectDB.create_user_account(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hashed_pw,
        role="citizen",
        phone=payload.phone
    )
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create citizen profile.")

    token = create_access_token({"sub": str(user["id"]), "role": "citizen"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/register-official", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_official(payload: OfficialRegisterRequest):
    """
    Register an MCD / Government Official account.
    Requires department and official badge ID.
    """
    existing = DirectDB.get_profile_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    user = DirectDB.create_user_account(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hashed_pw,
        role="official",
        phone=payload.phone,
        department=payload.department,
        official_badge_id=payload.official_badge_id
    )
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create official profile.")

    token = create_access_token({"sub": str(user["id"]), "role": "official"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=AuthTokenResponse)
async def login(payload: LoginRequest):
    """
    Authenticate Citizen or Official and receive a cryptographically signed JWT token.
    """
    user = DirectDB.get_profile_by_email(payload.email)
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": str(user["id"]), "role": user.get("role", "citizen")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """
    Fetch profile of the currently authenticated user.
    """
    return current_user
