import os
import uuid
import logging
from typing import Dict, Any, Optional
from PIL import Image
from backend.app.core.config import settings
from backend.app.db.supabase_client import get_supabase
from backend.app.services.detector import CivicAIDetector
from backend.app.schemas.complaint import TriageResult, IncidentResponse

logger = logging.getLogger(__name__)


def calculate_priority_score(base_severity: int, total_reports: int) -> int:
    """
    Calculates dynamic priority score (0-100) based on base hazard severity & report count.
    - Base severity (1-5) contributes 20-50 pts
    - Duplicates / report volume adds progressive urgency boost
    """
    duplicate_count = max(0, total_reports - 1)
    
    # Severity base component (scale to max 50 pts)
    base_component = base_severity * 10
    
    # Duplicity urgency bonus (up to 50 pts)
    if duplicate_count == 0:
        duplicity_bonus = 0
    elif duplicate_count == 1:
        duplicity_bonus = 20
    elif duplicate_count == 2:
        duplicity_bonus = 35
    elif duplicate_count == 3:
        duplicity_bonus = 42
    else:
        duplicity_bonus = 50

    return min(100, base_component + duplicity_bonus)


class TriageService:
    @staticmethod
    def upload_image(image_bytes: bytes, filename: str) -> str:
        """
        Uploads image to Supabase Storage bucket, or returns a local file reference.
        """
        supabase = get_supabase()
        file_ext = filename.split(".")[-1] if "." in filename else "jpg"
        unique_name = f"reports/{uuid.uuid4()}.{file_ext}"

        if supabase:
            try:
                # Upload to Supabase Storage
                bucket = settings.SUPABASE_STORAGE_BUCKET
                supabase.storage.from_(bucket).upload(
                    path=unique_name,
                    file=image_bytes,
                    file_options={"content-type": f"image/{file_ext}"}
                )
                public_url = supabase.storage.from_(bucket).get_public_url(unique_name)
                return public_url
            except Exception as e:
                logger.error(f"Failed to upload to Supabase storage: {e}")

        # Fallback to web-accessible local image path
        local_dir = "uploaded_images"
        os.makedirs(local_dir, exist_ok=True)
        img_filename = f"{uuid.uuid4()}.{file_ext}"
        local_path = os.path.join(local_dir, img_filename)
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        return f"/uploaded_images/{img_filename}"

    @classmethod
    def process_submission(
        cls,
        image: Image.Image,
        image_bytes: bytes,
        filename: str,
        latitude: float,
        longitude: float,
        description: Optional[str] = None,
        citizen_id: Optional[str] = None,
        address: Optional[str] = None
    ) -> TriageResult:
        """
        End-to-end civic complaint triage:
        1. AI Zero-Shot Classification & Visual Embedding extraction
        2. Rejection of non-civic photos
        3. Supabase PostGIS + pgvector Deduplication check
        4. Clustering and Priority scoring update
        """
        detector = CivicAIDetector.get_instance()
        ai_result = detector.analyze_image(image)

        category = ai_result["category"]
        confidence = ai_result["confidence"]
        margin = ai_result["margin"]
        is_civic = ai_result["is_civic_issue"]
        base_severity = ai_result["base_severity"]
        embedding = ai_result["embedding"]

        # If not a recognized civic problem, reject
        if not is_civic:
            return TriageResult(
                is_civic_issue=False,
                detected_category=category,
                confidence=confidence,
                margin=margin,
                is_duplicate=False,
                incident_id=None,
                priority_score=0,
                message="Image does not appear to show a recognized civic infrastructure issue."
            )

        # Upload image to storage
        image_url = cls.upload_image(image_bytes, filename)
        supabase = get_supabase()

        is_duplicate = False
        incident_id = None
        current_priority = calculate_priority_score(base_severity, total_reports=1)
        incident_record = None

        from backend.app.db.postgres_direct import DirectDB

        # 1. Check for nearby & visual duplicates using PostGIS & pgvector
        matched = DirectDB.match_incident(
            target_lat=latitude,
            target_lng=longitude,
            query_embedding=embedding,
            match_radius_meters=settings.GEO_MATCH_RADIUS_METERS,
            similarity_threshold=settings.SIMILARITY_THRESHOLD
        )

        if matched:
            incident_id = matched["incident_id"]
            is_duplicate = True
            new_total_reports = matched["total_reports"] + 1
            new_duplicate_count = matched["duplicate_count"] + 1
            new_priority = calculate_priority_score(base_severity, new_total_reports)

            incident_record = DirectDB.update_incident_duplicates(
                incident_id=incident_id,
                total_reports=new_total_reports,
                duplicate_count=new_duplicate_count,
                priority_score=new_priority
            )
            current_priority = new_priority
            logger.info(f"Duplicate match found for incident {incident_id}. Elevated priority: {new_priority}")
        else:
            incident_record = DirectDB.create_incident({
                "category": category,
                "title": f"{category.replace('_', ' ').title()} reported",
                "description": description,
                "status": "OPEN",
                "priority_score": current_priority,
                "base_severity": base_severity,
                "total_reports": 1,
                "duplicate_count": 0,
                "primary_image_url": image_url,
                "embedding": embedding,
                "latitude": latitude,
                "longitude": longitude,
                "address": address
            })
            if incident_record:
                incident_id = incident_record["id"]
                logger.info(f"Created new incident cluster: {incident_id}")

        # 2. Record citizen individual complaint report
        DirectDB.record_complaint_report({
            "incident_id": incident_id,
            "citizen_id": citizen_id or "anonymous",
            "image_url": image_url,
            "embedding": embedding,
            "latitude": latitude,
            "longitude": longitude,
            "description": description,
            "detected_category": category,
            "confidence": confidence,
            "is_duplicate": is_duplicate
        })

        msg = (
            f"Duplicate report registered. Existing incident priority elevated to {current_priority}/100."
            if is_duplicate
            else f"New civic issue recorded successfully. Priority score: {current_priority}/100."
        )

        return TriageResult(
            is_civic_issue=True,
            detected_category=category,
            confidence=confidence,
            margin=margin,
            is_duplicate=is_duplicate,
            incident_id=incident_id,
            priority_score=current_priority,
            message=msg,
            incident=incident_record
        )
