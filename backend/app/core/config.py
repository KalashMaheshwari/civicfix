import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = Field(default_factory=lambda: os.getenv("PROJECT_NAME", "CivicFix Backend"))
    API_V1_STR: str = Field(default_factory=lambda: os.getenv("API_V1_STR", "/api/v1"))
    
    # Supabase Settings
    SUPABASE_URL: Optional[str] = Field(default_factory=lambda: os.getenv("SUPABASE_URL"))
    SUPABASE_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("SUPABASE_KEY"))
    DATABASE_URL: Optional[str] = Field(default_factory=lambda: os.getenv("DATABASE_URL"))
    SUPABASE_STORAGE_BUCKET: str = Field(default_factory=lambda: os.getenv("SUPABASE_STORAGE_BUCKET", "civic-issues"))
    
    # AI & Computer Vision Settings
    CLIP_MODEL_NAME: str = Field(default_factory=lambda: os.getenv("CLIP_MODEL_NAME", "openai/clip-vit-base-patch32"))
    CONFIDENCE_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("CONFIDENCE_THRESHOLD", "0.70")))
    MARGIN_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("MARGIN_THRESHOLD", "0.15")))
    SIMILARITY_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("SIMILARITY_THRESHOLD", "0.85")))
    
    # Geospatial Deduplication Distance (in meters)
    GEO_MATCH_RADIUS_METERS: float = Field(default_factory=lambda: float(os.getenv("GEO_MATCH_RADIUS_METERS", "50.0")))


settings = Settings()
