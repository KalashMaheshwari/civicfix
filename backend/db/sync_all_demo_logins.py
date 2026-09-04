import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.app.core.security import hash_password, verify_password
from backend.app.db.postgres_direct import DirectDB, get_db_cursor

def fix_all_accounts():
    accounts = [
        ("priya.singh@gmail.com", "Priya Singh", "password123", "citizen", "+919876543210", None, None),
        ("citizen@demo.com", "Arjun Sharma", "password123", "citizen", "+919999999999", None, None),
        ("official1@mcd.gov.in", "Inspector Rajesh Verma", "admin123", "official", "+918888888888", "Roads & Works", "MCD-8492"),
        ("official@demo.gov.in", "Inspector Rajesh Verma", "admin123", "official", "+918888888888", "Roads & Works", "MCD-8492")
    ]
    
    with get_db_cursor(commit=True) as cur:
        for email, name, pw, role, phone, dept, badge in accounts:
            existing = DirectDB.get_profile_by_email(email)
            pw_hash = hash_password(pw)
            if existing:
                print(f"Updating password hash for existing {email}...")
                cur.execute(
                    "UPDATE profiles SET password_hash = %s, role = %s, department = %s, official_badge_id = %s WHERE email = %s;",
                    (pw_hash, role, dept, badge, email)
                )
            else:
                print(f"Creating profile for {email}...")
                DirectDB.create_user_account(
                    full_name=name,
                    email=email,
                    password_hash=pw_hash,
                    role=role,
                    phone=phone,
                    department=dept,
                    official_badge_id=badge
                )

    print("\nVerification Test:")
    for email, name, pw, role, phone, dept, badge in accounts:
        user = DirectDB.get_profile_by_email(email)
        valid = verify_password(pw, user["password_hash"]) if user and user.get("password_hash") else False
        print(f"  {email} ({pw}): {'VALIDATED' if valid else 'FAILED'}")

if __name__ == "__main__":
    fix_all_accounts()
