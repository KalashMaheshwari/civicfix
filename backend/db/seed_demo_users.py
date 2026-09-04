import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.core.security import hash_password
from backend.app.db.postgres_direct import DirectDB, get_db_cursor

def seed():
    print("Updating/Ensuring demo accounts in live Supabase PostgreSQL...")
    
    # 1. Citizen Demo Account (citizen@demo.com / password123)
    citizen_email = "citizen@demo.com"
    existing_citizen = DirectDB.get_profile_by_email(citizen_email)
    if existing_citizen:
        print(f"Updating password for existing citizen {citizen_email}...")
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE profiles SET password_hash = %s, role = 'citizen' WHERE email = %s;",
                (hash_password("password123"), citizen_email)
            )
    else:
        print(f"Creating citizen account: {citizen_email}...")
        DirectDB.create_user_account(
            full_name="Arjun Sharma",
            email=citizen_email,
            password_hash=hash_password("password123"),
            role="citizen",
            phone="+919999999999"
        )

    # 2. Official Demo Account (official@demo.gov.in / admin123)
    official_email = "official@demo.gov.in"
    existing_official = DirectDB.get_profile_by_email(official_email)
    if existing_official:
        print(f"Updating password for existing official {official_email}...")
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE profiles SET password_hash = %s, role = 'official', department = 'Roads & Works', official_badge_id = 'MCD-8492' WHERE email = %s;",
                (hash_password("admin123"), official_email)
            )
    else:
        print(f"Creating official account: {official_email}...")
        DirectDB.create_user_account(
            full_name="Inspector Rajesh Verma",
            email=official_email,
            password_hash=hash_password("admin123"),
            role="official",
            phone="+918888888888",
            department="Roads & Works",
            official_badge_id="MCD-8492"
        )

    # 3. Also update official1@mcd.gov.in if used
    mcd_email = "official1@mcd.gov.in"
    existing_mcd = DirectDB.get_profile_by_email(mcd_email)
    if existing_mcd:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "UPDATE profiles SET password_hash = %s WHERE email = %s;",
                (hash_password("admin123"), mcd_email)
            )

    print("All demo user accounts are updated and ready for live login!")

if __name__ == "__main__":
    seed()
