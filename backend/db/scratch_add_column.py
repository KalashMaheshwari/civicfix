import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.db.postgres_direct import get_db_connection

def add_column():
    print("Adding proof_image_url to incident_feedbacks...")
    conn = get_db_connection()
    if conn:
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE incident_feedbacks ADD COLUMN IF NOT EXISTS proof_image_url text;")
            conn.commit()
            print("Successfully added proof_image_url column.")
        conn.close()

if __name__ == "__main__":
    add_column()
