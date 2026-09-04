import os
import sys
import uuid
import json
import datetime
import psycopg2
from PIL import Image
from backend.app.services.detector import CivicAIDetector

print("Starting clean wipe and re-seed with custom demo issues...")

conn = psycopg2.connect('postgresql://postgres.pvjtmauqzestklvmunhk:Kalash01080@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
cur = conn.cursor()

# 1. Clean wipe existing issue tables
print("Wiping old issue records...")
cur.execute("DELETE FROM incident_feedbacks;")
cur.execute("DELETE FROM complaint_reports;")
cur.execute("DELETE FROM incidents;")
conn.commit()
print("Tables wiped cleanly.")

# 2. Get Users for attribution
cur.execute("SELECT id, email, role, full_name FROM profiles;")
users = cur.fetchall()

citizen_id = next((u[0] for u in users if u[1] == 'priya.singh@gmail.com'), None)
if not citizen_id:
    citizen_id = next((u[0] for u in users if u[2] == 'citizen'), str(users[0][0]))

official_id = next((u[0] for u in users if u[1] == 'official1@mcd.gov.in'), None)
if not official_id:
    official_id = next((u[0] for u in users if u[2] == 'official'), str(users[0][0]))
official_name = next((u[3] for u in users if u[0] == official_id), "Rajesh Verma (MCD Senior Engineer)")

print(f"Assigning initial reports to Citizen: {citizen_id}")
print(f"Assigning official resolutions to: {official_id} ({official_name})")

# 3. Define curated Ward-04 Delhi issues using user's real images
detector = CivicAIDetector.get_instance()
demo_dir = os.path.join("frontend", "public", "demo issues")
fixed_dir = os.path.join(demo_dir, "issue fixed")

issues_manifest = [
    {
        "category": "pothole",
        "title": "Hazardous Deep Asphalt Crater & Pothole",
        "description": "Severe road crater on Sector 14 transit corridor causing vehicle damage and water pooling during peak traffic hours.",
        "latitude": 28.6328,
        "longitude": 77.2197,
        "address": "Outer Ring Road, Ward-04, Karol Bagh Zone, New Delhi",
        "status": "RESOLVED_PENDING_VERIFICATION",
        "base_severity": 4,
        "priority_score": 75,
        "assigned_department": "MCD Road Maintenance & Surface Works",
        "primary_image_rel": "/demo issues/pothole.jpg",
        "primary_image_file": os.path.join(demo_dir, "pothole.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/pothole.jpg",
        "resolution_notes": "Bitumen cold-mix asphalt overlay applied, leveled with roller, and traffic barricades cleared.",
        "resolved_hours_ago": 3,
        "feedback_yes": 4,
        "feedback_no": 0
    },
    {
        "category": "waterlogging",
        "title": "Severe Monsoon Waterlogging & Stagnant Road Flooding",
        "description": "Road heavily flooded due to choked stormwater drain. Water depth approx 1.5 ft, posing major risk of dengue breeding and traffic blockage.",
        "latitude": 28.6415,
        "longitude": 77.2120,
        "address": "Main Market Road near Metro Pillar 118, Ward-04, New Delhi",
        "status": "RESOLVED_PENDING_VERIFICATION",
        "base_severity": 5,
        "priority_score": 88,
        "assigned_department": "MCD Drainage & Stormwater Division",
        "primary_image_rel": "/demo issues/waterlogging.jpg",
        "primary_image_file": os.path.join(demo_dir, "waterlogging.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/waterlogging.jpg",
        "resolution_notes": "High-capacity diesel suction pumps deployed, culvert silt removed, and road surface completely dewatered.",
        "resolved_hours_ago": 5,
        "feedback_yes": 6,
        "feedback_no": 1
    },
    {
        "category": "garbage",
        "title": "Overflowing Public Garbage Dump & Solid Waste Pile",
        "description": "Massive solid waste accumulation spilling across the pedestrian footpath and road. Emitting strong foul odor and attracting stray cattle.",
        "latitude": 28.6289,
        "longitude": 77.2065,
        "address": "Commercial Complex Lane, Pusa Road, Ward-04, New Delhi",
        "status": "RESOLVED_PENDING_VERIFICATION",
        "base_severity": 3,
        "priority_score": 62,
        "assigned_department": "MCD Sanitation & Solid Waste Management",
        "primary_image_rel": "/demo issues/garbage.jpg",
        "primary_image_file": os.path.join(demo_dir, "garbage.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/garbage.jpg",
        "resolution_notes": "Sanitation compactor truck cleared all refuse, area sanitized with disinfectant powder, and new municipal dustbin installed.",
        "resolved_hours_ago": 2,
        "feedback_yes": 3,
        "feedback_no": 0
    },
    {
        "category": "road_damage",
        "title": "Extensive Bitumen Cracking & Structural Road Damage",
        "description": "Heavy structural alligator cracking across both lanes. Surface crumbling under commercial truck transit.",
        "latitude": 28.6360,
        "longitude": 77.2250,
        "address": "Old Rajinder Nagar Junction, Ward-04, New Delhi",
        "status": "IN_PROGRESS",
        "base_severity": 4,
        "priority_score": 68,
        "assigned_department": "MCD Highway & Pavement Division",
        "primary_image_rel": "/demo issues/road_cracks.jpg",
        "primary_image_file": os.path.join(demo_dir, "road_cracks.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/cracked_road.jpg",
        "resolution_notes": None,
        "resolved_hours_ago": None,
        "feedback_yes": 0,
        "feedback_no": 0
    },
    {
        "category": "infrastructure_damage",
        "title": "Uncovered Deep Manhole Chamber & Broken Drain Grid",
        "description": "Dangerous open manhole on active pedestrian path. Extreme hazard of fatal fall for pedestrians and two-wheelers at night.",
        "latitude": 28.6480,
        "longitude": 77.2010,
        "address": "Service Lane near Community Park Gate 2, Ward-04, New Delhi",
        "status": "RESOLVED_PENDING_VERIFICATION",
        "base_severity": 5,
        "priority_score": 95,
        "assigned_department": "Delhi Jal Board / MCD Underground Drainage",
        "primary_image_rel": "/demo issues/manhole.jpg",
        "primary_image_file": os.path.join(demo_dir, "manhole.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/manhole.jpg",
        "resolution_notes": "Heavy-duty reinforced cast iron manhole cover installed and cemented flush with surrounding walkway.",
        "resolved_hours_ago": 1,
        "feedback_yes": 5,
        "feedback_no": 0
    },
    {
        "category": "electrical_streetlight_hazard",
        "title": "Exposed Hanging High-Voltage Electrical Cables",
        "description": "Loose tangled electrical and internet cables dangling right above the street corner at head height. Risk of sparking during rainfall.",
        "latitude": 28.6390,
        "longitude": 77.2180,
        "address": "Shankar Road Corner, Ward-04, New Delhi",
        "status": "OPEN",
        "base_severity": 5,
        "priority_score": 92,
        "assigned_department": "BSES Yamuna / MCD Streetlight Division",
        "primary_image_rel": "/demo issues/open_cables.jpg",
        "primary_image_file": os.path.join(demo_dir, "open_cables.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/open_cables.jpg",
        "resolution_notes": None,
        "resolved_hours_ago": None,
        "feedback_yes": 0,
        "feedback_no": 0
    },
    {
        "category": "fallen_obstruction",
        "title": "Massive Fallen Tree Blocking Transit Thoroughfare",
        "description": "Large roadside neem tree uprooted after storm, completely blocking both vehicular lanes and crushing footpath guard rails.",
        "latitude": 28.6250,
        "longitude": 77.2150,
        "address": "Patel Nagar Extension Road, Ward-04, New Delhi",
        "status": "RESOLVED_PENDING_VERIFICATION",
        "base_severity": 4,
        "priority_score": 85,
        "assigned_department": "MCD Horticulture & Emergency Clearance",
        "primary_image_rel": "/demo issues/fallen_tree.jpg",
        "primary_image_file": os.path.join(demo_dir, "fallen_tree.jpg"),
        "resolution_image_rel": "/demo issues/issue fixed/Fallen_tree.jpg",
        "resolution_notes": "Horticulture emergency team sawed and hauled trunk and branches. Roadway swept and opened to two-way traffic.",
        "resolved_hours_ago": 4,
        "feedback_yes": 8,
        "feedback_no": 0
    }
]

print("Computing CLIP vector embeddings and inserting into Supabase...")
for item in issues_manifest:
    img = Image.open(item["primary_image_file"]).convert("RGB")
    emb = detector.extract_embedding(img)
    emb_str = "[" + ",".join(map(str, emb)) + "]"
    
    resolved_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=item["resolved_hours_ago"]) if item["resolved_hours_ago"] else None
    
    cur.execute("""
        INSERT INTO incidents (
            category, title, description, location, latitude, longitude, address,
            status, priority_score, base_severity, primary_image_url, embedding,
            total_reports, duplicate_count, assigned_department, assigned_officer_id,
            assigned_officer_name, resolution_image_url, resolution_notes, resolved_at,
            resolved_by_official_id, citizen_feedback_yes, citizen_feedback_no,
            citizen_verified_status, created_at, updated_at
        ) VALUES (
            %s, %s, %s,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s, %s, %s, %s, %s, %s, %s, %s::vector, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now()
        ) RETURNING id;
    """, (
        item["category"],
        item["title"],
        item["description"],
        item["longitude"],
        item["latitude"],
        item["latitude"],
        item["longitude"],
        item["address"],
        item["status"],
        item["priority_score"],
        item["base_severity"],
        item["primary_image_rel"],
        emb_str,
        1,
        0,
        item["assigned_department"],
        official_id if item["status"] != "OPEN" else None,
        official_name if item["status"] != "OPEN" else None,
        item["resolution_image_rel"] if item["status"] in ["RESOLVED_PENDING_VERIFICATION", "CLOSED_VERIFIED"] else None,
        item["resolution_notes"],
        resolved_at,
        official_id if resolved_at else None,
        item["feedback_yes"],
        item["feedback_no"],
        "PENDING" if item["status"] == "RESOLVED_PENDING_VERIFICATION" else "VERIFIED" if item["status"] == "CLOSED_VERIFIED" else "NONE",
    ))
    
    inc_id = cur.fetchone()[0]
    
    # Also record citizen complaint_report
    cur.execute("""
        INSERT INTO complaint_reports (
            incident_id, citizen_id, image_url, embedding, latitude, longitude, location,
            description, detected_category, confidence, is_duplicate, created_at
        ) VALUES (
            %s, %s, %s, %s::vector, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s, %s, %s, %s, now()
        );
    """, (
        inc_id,
        citizen_id,
        item["primary_image_rel"],
        emb_str,
        item["latitude"],
        item["longitude"],
        item["longitude"],
        item["latitude"],
        item["description"],
        item["category"],
        0.94,
        False
    ))
    
    print(f"[OK] Inserted [{item['category']}] -> {item['title']} (ID: {inc_id})")

conn.commit()
conn.close()
print("\nAll 7 curated demo issues with before & after photos successfully loaded into Supabase!")
