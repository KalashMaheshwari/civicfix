import io
from typing import Optional, List, Dict, Any
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, status, Depends
from backend.app.schemas.complaint import (
    TriageResult,
    IncidentResponse,
    IncidentStatusUpdate,
    CitizenFeedbackCreate,
    CitizenFeedbackResponse
)
from backend.app.services.triage import TriageService
from backend.app.db.postgres_direct import DirectDB
from backend.app.core.deps import get_current_user, require_roles

router = APIRouter()


# ==============================================================================
# 1. CITIZEN COMPLAINT SUBMISSION (Protected: Citizens & Officials)
# ==============================================================================
@router.post("/report", response_model=TriageResult, status_code=status.HTTP_201_CREATED)
async def report_complaint(
    file: UploadFile = File(..., description="Photograph of the civic issue"),
    latitude: float = Form(..., description="GPS Latitude"),
    longitude: float = Form(..., description="GPS Longitude"),
    description: Optional[str] = Form(None, description="Optional description from citizen"),
    address: Optional[str] = Form(None, description="Street address or landmark"),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a civic complaint with image and GPS coordinates.
    Requires authenticated user token.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, WEBP)."
        )

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image file: {str(e)}"
        )

    citizen_id = str(current_user["id"])

    result = TriageService.process_submission(
        image=image,
        image_bytes=image_bytes,
        filename=file.filename or "report.jpg",
        latitude=latitude,
        longitude=longitude,
        description=description,
        citizen_id=citizen_id,
        address=address
    )

    return result


# ==============================================================================
# 2. LIST & VIEW INCIDENTS
# ==============================================================================
@router.get("/incidents", response_model=List[IncidentResponse])
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    category_filter: Optional[str] = Query(None, alias="category", description="Filter by category"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    List civic incident clusters sorted by priority score (highest first).
    Publicly accessible or authenticated.
    """
    return DirectDB.list_incidents(status_filter=status_filter, category_filter=category_filter, limit=limit)


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """
    Get detailed information for a specific incident, citizen reports,
    resolution proof photos, and citizen verification feedbacks.
    """
    incident = DirectDB.get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    reports = DirectDB.get_incident_reports(incident_id)
    feedbacks = DirectDB.get_incident_feedbacks(incident_id)

    return {
        "incident": incident,
        "reports": reports,
        "feedbacks": feedbacks
    }


# ==============================================================================
# 3. MCD / GOVT OFFICIAL RESOLUTION (Guarded: STRICTLY 'official' OR 'admin')
# ==============================================================================
@router.post("/incidents/{incident_id}/resolve")
async def resolve_incident_by_govt(
    incident_id: str,
    file: UploadFile = File(..., description="Post-repair proof photograph"),
    resolution_notes: Optional[str] = Form(None, description="Notes on work performed"),
    current_official: dict = Depends(require_roles(["official", "admin"]))
):
    """
    Government / MCD Official action:
    Requires an authenticated Official or Admin token.
    Uploads a photo of the repaired issue at the same location and marks the issue
    as 'RESOLVED_PENDING_VERIFICATION'. It is then flashed to citizens for verification.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, WEBP)."
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}"
        )

    resolution_image_url = TriageService.upload_image(image_bytes, file.filename or "resolution.jpg")

    updated = DirectDB.resolve_incident_by_official(
        incident_id=incident_id,
        resolution_image_url=resolution_image_url,
        resolution_notes=resolution_notes,
        official_id=str(current_official["id"]),
        official_name=current_official.get("full_name")
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found or failed to update.")

    return {
        "message": f"Incident marked RESOLVED_PENDING_VERIFICATION. Flashed to citizens for YES/NO review.",
        "incident": updated
    }


# ==============================================================================
# 4. CITIZEN YES / NO VERIFICATION VOTE (Guarded: STRICTLY 'citizen')
# ==============================================================================
@router.post("/incidents/{incident_id}/vote-feedback")
async def vote_incident_feedback(
    incident_id: str,
    is_fixed: bool = Form(...),
    comment: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None, description="Proof photo (required if is_fixed is False)"),
    current_citizen: dict = Depends(require_roles(["citizen", "admin"]))
):
    """
    Citizen action:
    Requires an authenticated Citizen account.
    Citizen reviews before/after photos and votes:
    - YES (is_fixed=true) -> Incident transitions to 'CLOSED_VERIFIED'
    - NO  (is_fixed=false) -> Incident transitions to 'DISPUTED_REOPENED'. Requires photo proof.
    """
    if not is_fixed and not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A proof photograph is required when reporting an issue as unresolved."
        )

    citizen_id = str(current_citizen["id"])
    proof_image_url = None

    if file:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image (JPEG, PNG, WEBP)."
            )
        try:
            image_bytes = await file.read()
            proof_image_url = TriageService.upload_image(image_bytes, file.filename or "proof.jpg")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {str(e)}"
            )

    result = DirectDB.record_citizen_feedback(
        incident_id=incident_id,
        citizen_id=citizen_id,
        is_fixed=is_fixed,
        comment=comment,
        proof_image_url=proof_image_url
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to record citizen feedback.")

    action = "confirmed as FIXED (YES)" if is_fixed else "flagged as UNRESOLVED (NO - REOPENED)"

    return {
        "message": f"Feedback recorded! Issue {action}.",
        "feedback": result["feedback"],
        "incident": result["updated_incident"]
    }


# ==============================================================================
# 5. REAL-TIME LIVE INCIDENTS STREAM (Server-Sent Events / SSE)
# ==============================================================================
import asyncio
import json
from fastapi.responses import StreamingResponse

@router.get("/stream")
async def stream_incident_updates():
    """
    Server-Sent Events endpoint streaming real-time queue changes and audits.
    """
    async def event_generator():
        last_count = -1
        while True:
            try:
                incidents = DirectDB.list_incidents(limit=25)
                current_payload = json.dumps([
                    {"id": i["id"], "status": i["status"], "priority_score": i["priority_score"]}
                    for i in incidents
                ])
                yield f"data: {current_payload}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            await asyncio.sleep(5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
