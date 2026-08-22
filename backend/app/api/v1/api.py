from fastapi import APIRouter
from backend.app.api.v1.endpoints import complaints, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Security"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints & Incidents"])
