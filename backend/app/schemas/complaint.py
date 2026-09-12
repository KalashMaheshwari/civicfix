from datetime import datetime
from typing import Optional, List, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# ==============================================================================
# PROFILES (Citizens vs MCD / Govt Officials)
# ==============================================================================
class ProfileBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = Field("citizen", description="'citizen', 'official', or 'admin'")
    department: Optional[str] = Field(None, description="Department for officials (e.g. Sanitation, Roads, Electricity)")
    official_badge_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileCreate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: Union[str, UUID]
    civic_points: int = 10
    reputation_score: int = 95
    impact_score: int = 70
    level: int = 1
    level_title: str = "Alert Resident"
    verified_reports_count: int = 0
    verifications_count: int = 0
    commuters_assisted: int = 0
    category_counts: Optional[dict] = None
    recent_audits: Optional[List[dict]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# INCIDENTS
# ==============================================================================
class IncidentBase(BaseModel):
    category: str
    title: Optional[str] = None
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(IncidentBase):
    id: Union[str, UUID]
    status: str
    priority_score: int
    base_severity: int
    duplicate_count: int
    total_reports: int
    primary_image_url: str
    assigned_department: Optional[str] = None
    assigned_officer_id: Optional[Union[str, UUID]] = None
    assigned_officer_name: Optional[str] = None
    resolution_image_url: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by_official_id: Optional[Union[str, UUID]] = None
    resolved_at: Optional[datetime] = None
    citizen_feedback_yes: int = 0
    citizen_feedback_no: int = 0
    citizen_verified_status: str = "PENDING"
    citizen_ids: Optional[List[str]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# OFFICIAL RESOLUTION & CITIZEN FEEDBACK
# ==============================================================================
class OfficialResolutionSubmission(BaseModel):
    official_id: Optional[Union[str, UUID]] = None
    official_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: str = Field(..., description="Proof photo of fixed issue")


class CitizenFeedbackCreate(BaseModel):
    citizen_id: str
    is_fixed: bool = Field(..., description="True if fixed (YES), False if not fixed (NO)")
    comment: Optional[str] = None


class CitizenFeedbackResponse(BaseModel):
    id: Union[str, UUID]
    incident_id: Union[str, UUID]
    citizen_id: str
    is_fixed: bool
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., description="OPEN, IN_PROGRESS, RESOLVED_PENDING_VERIFICATION, CLOSED_VERIFIED, DISPUTED_REOPENED, REJECTED")
    assigned_department: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None


class ComplaintReportResponse(BaseModel):
    id: Union[str, UUID]
    incident_id: Optional[Union[str, UUID]] = None
    citizen_id: Optional[str] = None
    image_url: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    detected_category: str
    confidence: float
    is_duplicate: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TriageResult(BaseModel):
    is_civic_issue: bool
    detected_category: str
    confidence: float
    margin: float
    is_duplicate: bool
    incident_id: Optional[Union[str, UUID]] = None
    priority_score: int
    message: str
    incident: Optional[IncidentResponse] = None

    model_config = ConfigDict(from_attributes=True)
