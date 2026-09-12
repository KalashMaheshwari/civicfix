import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Connection pool instance (re-used across API requests for 10x-50x faster response time)
_db_pool = None

def get_connection_pool():
    global _db_pool
    if _db_pool is None:
        db_url = settings.DATABASE_URL or os.getenv("DATABASE_URL")
        if not db_url:
            return None
        try:
            # Min 2, max 20 pooled persistent connections
            _db_pool = pool.ThreadedConnectionPool(2, 20, db_url)
            logger.info("PostgreSQL ThreadedConnectionPool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection pool: {e}")
            return None
    return _db_pool


@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Context manager that leases a connection from the pool,
    yields a RealDictCursor, and returns the connection back to the pool instantly.
    """
    p = get_connection_pool()
    conn = None
    if p:
        try:
            conn = p.getconn()
        except Exception as e:
            logger.error(f"Failed to get connection from pool: {e}")
            conn = None

    # Fallback to direct connection if pool fails
    if conn is None:
        db_url = settings.DATABASE_URL or os.getenv("DATABASE_URL")
        if not db_url:
            yield None
            return
        conn = psycopg2.connect(db_url)
        is_direct = True
    else:
        is_direct = False

    try:
        if commit:
            conn.autocommit = True
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
    finally:
        if is_direct:
            conn.close()
        elif p and conn:
            p.putconn(conn)


class DirectDB:
    # =========================================================================
    # PROFILES & AUTHENTICATION (Citizens & Officials)
    # =========================================================================
    @staticmethod
    def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return None
                cur.execute("SELECT * FROM profiles WHERE id = %s;", (profile_id,))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching profile by ID: {e}")
            return None

    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return None
                cur.execute("SELECT * FROM profiles WHERE email = %s;", (email.lower().strip(),))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching profile by email: {e}")
            return None

    @staticmethod
    def create_user_account(
        full_name: str,
        email: str,
        password_hash: str,
        role: str = "citizen",
        phone: Optional[str] = None,
        department: Optional[str] = None,
        official_badge_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                cur.execute(
                    """
                    INSERT INTO profiles (full_name, email, password_hash, role, phone, department, official_badge_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        full_name,
                        email.lower().strip(),
                        password_hash,
                        role,
                        phone,
                        department,
                        official_badge_id
                    )
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error creating user account: {e}")
            return None

    # =========================================================================
    # DEDUPLICATION & INCIDENT MANAGEMENT
    # =========================================================================
    @staticmethod
    def match_incident(
        target_lat: float,
        target_lng: float,
        query_embedding: List[float],
        match_radius_meters: float = 50.0,
        similarity_threshold: float = 0.85
    ) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return None
                embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
                cur.execute(
                    """
                    SELECT 
                        i.id as incident_id,
                        i.category,
                        i.status,
                        i.priority_score,
                        i.total_reports,
                        i.duplicate_count,
                        i.primary_image_url,
                        ST_Distance(i.location, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) as distance_meters,
                        (1 - (i.embedding <=> %s::vector)) as visual_similarity
                    FROM incidents i
                    WHERE i.status NOT IN ('CLOSED_VERIFIED', 'REJECTED')
                      AND i.embedding IS NOT NULL
                      AND ST_DWithin(i.location, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                      AND (1 - (i.embedding <=> %s::vector)) >= %s
                    ORDER BY visual_similarity DESC, distance_meters ASC
                    LIMIT 1;
                    """,
                    (target_lng, target_lat, embedding_str, target_lng, target_lat, match_radius_meters, embedding_str, similarity_threshold)
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error in match_incident direct SQL query: {e}")
            return None

    @staticmethod
    def create_new_incident(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                embedding_str = "[" + ",".join(map(str, data["embedding"])) + "]"
                cur.execute(
                    """
                    INSERT INTO incidents (
                        category, title, description, location, latitude, longitude,
                        address, status, priority_score, base_severity, primary_image_url,
                        embedding, total_reports, duplicate_count, assigned_department,
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                        %s, %s, %s, %s, %s, %s, %s, %s::vector, %s, %s, %s, now(), now()
                    ) RETURNING *;
                    """,
                    (
                        data["category"],
                        data.get("title") or f"{data['category'].replace('_', ' ').title()} Reported",
                        data.get("description"),
                        data["longitude"],
                        data["latitude"],
                        data["latitude"],
                        data["longitude"],
                        data.get("address"),
                        data.get("status", "OPEN"),
                        data.get("priority_score", 50),
                        data.get("base_severity", 50),
                        data["primary_image_url"],
                        embedding_str,
                        1,
                        0,
                        data.get("assigned_department", "MCD General Works")
                    )
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error creating incident in direct SQL: {e}")
            return None

    @staticmethod
    def update_incident_duplicates(incident_id: str, total_reports: int, duplicate_count: int, priority_score: int) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                cur.execute(
                    """
                    UPDATE incidents
                    SET total_reports = %s,
                        duplicate_count = %s,
                        priority_score = %s,
                        updated_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (total_reports, duplicate_count, priority_score, incident_id)
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error updating incident duplicates in direct SQL: {e}")
            return None

    @staticmethod
    def record_complaint_report(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                embedding_str = "[" + ",".join(map(str, data["embedding"])) + "]"
                cur.execute(
                    """
                    INSERT INTO complaint_reports (
                        incident_id, citizen_id, image_url, embedding,
                        latitude, longitude, description, detected_category,
                        confidence, is_duplicate
                    ) VALUES (
                        %s, %s, %s, %s::vector, %s, %s, %s, %s, %s, %s
                    ) RETURNING *;
                    """,
                    (
                        data.get("incident_id"), data.get("citizen_id", "anonymous"),
                        data["image_url"], embedding_str, data["latitude"], data["longitude"],
                        data.get("description"), data["detected_category"],
                        data.get("confidence"), data.get("is_duplicate", False)
                    )
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error recording complaint report in direct SQL: {e}")
            return None

    @staticmethod
    def list_incidents(
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        citizen_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return []
                # Fast column projection with citizen_ids attribution
                query = """
                    SELECT 
                        i.id, i.category, i.title, i.description, i.latitude, i.longitude, i.address,
                        i.status, i.priority_score, i.base_severity, i.duplicate_count, i.total_reports,
                        i.primary_image_url, i.assigned_department, i.assigned_officer_id,
                        i.assigned_officer_name, i.resolution_image_url, i.resolution_notes,
                        i.resolved_by_official_id, i.resolved_at, i.citizen_feedback_yes,
                        i.citizen_feedback_no, i.citizen_verified_status, i.created_at, i.updated_at,
                        COALESCE((
                            SELECT array_agg(DISTINCT cr.citizen_id)
                            FROM complaint_reports cr
                            WHERE cr.incident_id = i.id
                        ), ARRAY[]::text[]) as citizen_ids
                    FROM incidents i
                    WHERE 1=1
                """
                params = []
                if status_filter and status_filter != 'ALL':
                    query += " AND i.status = %s"
                    params.append(status_filter.upper())
                if category_filter:
                    query += " AND i.category = %s"
                    params.append(category_filter)
                if citizen_id:
                    query += """
                        AND EXISTS (
                            SELECT 1 FROM complaint_reports cr
                            WHERE cr.incident_id = i.id
                              AND (cr.citizen_id = %s OR cr.citizen_id = (SELECT email FROM profiles WHERE id::text = %s LIMIT 1))
                        )
                    """
                    params.extend([str(citizen_id), str(citizen_id)])
                query += " ORDER BY i.priority_score DESC, i.created_at DESC LIMIT %s;"
                params.append(limit)
                cur.execute(query, tuple(params))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error listing incidents in direct SQL: {e}")
            return []

    @staticmethod
    def get_incident_by_id(incident_id: str) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return None
                cur.execute("SELECT * FROM incidents WHERE id = %s;", (incident_id,))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching incident by ID: {e}")
            return None

    @staticmethod
    def get_incident_reports(incident_id: str) -> List[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return []
                cur.execute("SELECT * FROM complaint_reports WHERE incident_id = %s ORDER BY created_at DESC;", (incident_id,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching incident reports: {e}")
            return []

    # =========================================================================
    # OFFICIAL DISPATCH & RESOLUTION
    # =========================================================================
    @staticmethod
    def update_incident_status(
        incident_id: str,
        status: str,
        assigned_department: Optional[str] = None,
        assigned_officer_id: Optional[str] = None,
        assigned_officer_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                cur.execute(
                    """
                    UPDATE incidents
                    SET status = %s,
                        assigned_department = COALESCE(%s, assigned_department),
                        assigned_officer_id = COALESCE(%s, assigned_officer_id),
                        assigned_officer_name = COALESCE(%s, assigned_officer_name),
                        updated_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (status.upper(), assigned_department, assigned_officer_id, assigned_officer_name, incident_id)
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error updating incident status: {e}")
            return None

    @staticmethod
    def resolve_incident_by_official(
        incident_id: str,
        resolution_image_url: str,
        resolution_notes: Optional[str],
        official_id: str,
        official_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                cur.execute(
                    """
                    UPDATE incidents
                    SET status = 'RESOLVED_PENDING_VERIFICATION',
                        resolution_image_url = %s,
                        resolution_notes = %s,
                        resolved_by_official_id = %s,
                        assigned_officer_name = COALESCE(%s, assigned_officer_name),
                        resolved_at = now(),
                        updated_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (resolution_image_url, resolution_notes, official_id, official_name, incident_id)
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error resolving incident by official: {e}")
            return None

    # =========================================================================
    # CITIZEN VERIFICATION VOTES
    # =========================================================================
    @staticmethod
    def record_citizen_feedback(
        incident_id: str,
        citizen_id: str,
        is_fixed: bool,
        comment: Optional[str] = None,
        proof_image_url: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        try:
            with get_db_cursor(commit=True) as cur:
                if not cur:
                    return None
                cur.execute(
                    """
                    INSERT INTO incident_feedbacks (incident_id, citizen_id, is_fixed, comment, proof_image_url)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (incident_id, citizen_id)
                    DO UPDATE SET is_fixed = EXCLUDED.is_fixed, comment = EXCLUDED.comment, proof_image_url = EXCLUDED.proof_image_url, created_at = now()
                    RETURNING *;
                    """,
                    (incident_id, citizen_id, is_fixed, comment, proof_image_url)
                )
                feedback_row = cur.fetchone()

                # Fetch updated incident record after trigger fired
                cur.execute("SELECT * FROM incidents WHERE id = %s;", (incident_id,))
                incident_row = cur.fetchone()

                return {
                    "feedback": dict(feedback_row) if feedback_row else None,
                    "updated_incident": dict(incident_row) if incident_row else None
                }
        except Exception as e:
            logger.error(f"Error recording citizen feedback in PostgreSQL: {e}")
            return None

    @staticmethod
    def get_incident_feedbacks(incident_id: str) -> List[Dict[str, Any]]:
        try:
            with get_db_cursor() as cur:
                if not cur:
                    return []
                cur.execute("SELECT * FROM incident_feedbacks WHERE incident_id = %s ORDER BY created_at DESC;", (incident_id,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching feedbacks: {e}")
            return []
