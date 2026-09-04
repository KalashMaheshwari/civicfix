import os
import sys

# Add project root to sys.path so we can import backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.core.security import hash_password
from backend.app.db.postgres_direct import DirectDB, get_db_connection

def seed():
    print("Replacing demo accounts...")
    
    conn = get_db_connection()
    if conn:
        with conn.cursor() as cur:
            # Delete old demo users and their dependent data
            print("Deleting old demo users...")
            cur.execute("DELETE FROM profiles WHERE email IN ('priya.singh@gmail.com', 'official1@mcd.gov.in', 'citizen@demo.com', 'official@demo.gov.in');")
            conn.commit()
        conn.close()

    # New Citizen Demo
    citizen_email = "citizen@demo.com"
    print(f"Creating new citizen {citizen_email}...")
    DirectDB.create_user_account(
        full_name="Arjun Demo",
        email=citizen_email,
        password_hash=hash_password("password123"),
        role="citizen",
        phone="+919999999999"
    )

    # New Official Demo
    official_email = "official@demo.gov.in"
    print(f"Creating new official {official_email}...")
    DirectDB.create_user_account(
        full_name="Inspector Demo",
        email=official_email,
        password_hash=hash_password("admin123"),
        role="official",
        phone="+918888888888",
        department="Sanitation",
        official_badge_id="MCD-9999"
    )
        
    print("New demo users seeded successfully.")

if __name__ == "__main__":
    seed()
