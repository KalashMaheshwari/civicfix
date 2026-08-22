import sys
import psycopg2

DATABASE_URL = "postgresql://postgres:Kalash01080@db.pvjtmauqzestklvmunhk.supabase.co:5432/postgres"

def run_migration():
    print("Connecting to Supabase PostgreSQL database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connected successfully!")

        with open("backend/db/schema.sql", "r", encoding="utf-8") as f:
            sql = f.read()

        print("Executing schema.sql...")
        cursor.execute(sql)
        print("Schema applied successfully!")

        # Verify tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print("Existing tables in public schema:", tables)

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error executing migration: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
