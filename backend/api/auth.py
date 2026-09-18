"""
Authentication & Authorization Endpoints
AI-Powered Construction Site Vehicle & License Plate Monitoring System
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    token_type: str
    user: dict


# Prototype accounts
MOCK_USERS = {
    "admin": {
        "password": "admin123",
        "name": "Site Security Administrator",
        "role": "admin",
        "site": "Metro SkyTower Project - Gate 01"
    },
    "supervisor": {
        "password": "site2026",
        "name": "Heavy Equipment Supervisor",
        "role": "supervisor",
        "site": "North Sector Logistics"
    }
}


@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest):
    user = MOCK_USERS.get(creds.username)
    if not user or user["password"] != creds.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. For demo access use username 'admin' and password 'admin123'."
        )

    # Simulated prototype JWT token
    token = f"site-anpr-jwt-token-{creds.username}-{int(datetime.datetime.utcnow().timestamp())}"

    return {
        "token": token,
        "token_type": "bearer",
        "user": {
            "username": creds.username,
            "name": user["name"],
            "role": user["role"],
            "site": user["site"]
        }
    }


@router.get("/me")
def get_current_user(token: Optional[str] = None):
    # Returns default admin session profile
    return {
        "username": "admin",
        "name": "Site Security Administrator",
        "role": "admin",
        "site": "Metro SkyTower Construction Site"
    }
