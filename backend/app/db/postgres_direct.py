import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


def get_db_connection():
    db_url = settings.DATABASE_URL or os.getenv("DATABASE_URL")
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        return None


class DirectDB:
    # =========================================================================
    # PROFILES & AUTHENTICATION (Citizens & Officials)
    # =========================================================================
    @staticmethod
    def get_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM profiles WHERE id = %s;", (profile_id,))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching profile by ID: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def get_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM profiles WHERE email = %s;", (email.lower().strip(),))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching profile by email: {e}")
            return None
        finally:
            conn.close()

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
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
        finally:
            conn.close()

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
        conn = get_db_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
        finally:
            conn.close()

    @staticmethod
    def create_incident(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                embedding_str = "[" + ",".join(map(str, data["embedding"])) + "]"
                cur.execute(
                    """
                    INSERT INTO incidents (
                        category, title, description, status, priority_score,
                        base_severity, total_reports, duplicate_count,
                        primary_image_url, embedding, latitude, longitude, address,
                        assigned_department
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector, %s, %s, %s, %s
                    ) RETURNING *;
                    """,
                    (
                        data["category"], data.get("title"), data.get("description"),
                        data.get("status", "OPEN"), data.get("priority_score", 0),
                        data.get("base_severity", 1), data.get("total_reports", 1),
                        data.get("duplicate_count", 0), data["primary_image_url"],
                        embedding_str, data["latitude"], data["longitude"], data.get("address"),
                        data.get("assigned_department")
                    )
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error creating incident in direct SQL: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def update_incident_duplicates(incident_id: str, total_reports: int, duplicate_count: int, priority_score: int) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE incidents
                    SET total_reports = %s,
                        duplicate_count = %s,
                        priority_score = %s
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
        finally:
            conn.close()

    @staticmethod
    def record_complaint_report(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
        finally:
            conn.close()

    @staticmethod
    def list_incidents(status_filter: Optional[str] = None, category_filter: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = "SELECT * FROM incidents WHERE 1=1"
                params = []
                if status_filter:
                    query += " AND status = %s"
                    params.append(status_filter.upper())
                if category_filter:
                    query += " AND category = %s"
                    params.append(category_filter)
                query += " ORDER BY priority_score DESC, created_at DESC LIMIT %s;"
                params.append(limit)
                cur.execute(query, tuple(params))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error listing incidents in direct SQL: {e}")
            return []
        finally:
            conn.close()

    @staticmethod
    def get_incident_by_id(incident_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM incidents WHERE id = %s;", (incident_id,))
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching incident by ID: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def get_incident_reports(incident_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM complaint_reports WHERE incident_id = %s ORDER BY created_at DESC;", (incident_id,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching incident reports: {e}")
            return []
        finally:
            conn.close()

    # =========================================================================
    # GOVT OFFICIAL RESOLUTION
    # =========================================================================
    @staticmethod
    def resolve_incident_by_official(
        incident_id: str,
        resolution_image_url: str,
        resolution_notes: Optional[str] = None,
        official_id: Optional[str] = None,
        official_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE incidents
                    SET status = 'RESOLVED_PENDING_VERIFICATION',
                        resolution_image_url = %s,
                        resolution_notes = %s,
                        resolved_by_official_id = %s,
                        assigned_officer_name = coalesce(%s, assigned_officer_name),
                        resolved_at = now()
                    WHERE id = %s
                    RETURNING *;
                    """,
                    (resolution_image_url, resolution_notes, official_id, official_name, incident_id)
                )
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error marking incident resolved by official: {e}")
            return None
        finally:
            conn.close()

    # =========================================================================
    # CITIZEN FEEDBACK (YES / NO VERIFICATION)
    # =========================================================================
    @staticmethod
    def record_citizen_feedback(
        incident_id: str,
        citizen_id: str,
        is_fixed: bool,
        comment: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return None
        try:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO incident_feedbacks (incident_id, citizen_id, is_fixed, comment)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (incident_id, citizen_id)
                    DO UPDATE SET is_fixed = EXCLUDED.is_fixed, comment = EXCLUDED.comment, created_at = now()
                    RETURNING *;
                    """,
                    (incident_id, citizen_id, is_fixed, comment)
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
        finally:
            conn.close()

    @staticmethod
    def get_incident_feedbacks(incident_id: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        if not conn:
            return []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT * FROM incident_feedbacks WHERE incident_id = %s ORDER BY created_at DESC;", (incident_id,))
                return [dict(r) for r in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching feedbacks: {e}")
            return []
        finally:
            conn.close()
