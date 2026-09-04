# CivicFix — Municipal Intelligence & Accountability Platform

CivicFix is an AI-powered civic issue triage, deduplication, and municipal accountability platform designed for Indian urban local bodies (ULBs) such as the **Municipal Corporation of Delhi (MCD)**. 

It features strict role-based access control (RBAC), **OpenAI CLIP (ViT-B/32)** zero-shot computer vision hazard detection, **PostGIS + pgvector (512-dim cosine distance)** spatial-visual clustering, dynamic priority scoring (0–100), forensic EXIF GPS watermarking, and a bilingual (English / Hindi) Apple-inspired React frontend.

---

## 🌐 Live Deployments

* **Citizen & Community Portal**: [https://civicfixapp.vercel.app/](https://civicfixapp.vercel.app/)
* **MCD Official Engineering Console**: [https://civicfixapp.vercel.app/gov](https://civicfixapp.vercel.app/gov)
* **Backend API & Swagger Docs**: [https://civicfix-api-pmyf.onrender.com/docs](https://civicfix-api-pmyf.onrender.com/docs)
* **Live System Health & DB Probe**: [https://civicfix-api-pmyf.onrender.com/health](https://civicfix-api-pmyf.onrender.com/health)

---

## 🏗️ Architecture & Data Flow

```
[ Citizen Portal ] ──► Live Camera / Photo + GPS ──► OpenAI CLIP ViT-B/32 (512-d Embedding)
                                                                 │
                                                                 ▼
                                                   PostgreSQL / Supabase Engine
                                             • PostGIS (Spatial Distance <= 50m)
                                             • pgvector (Cosine Similarity >= 0.85)
                                                                 │
                                                                 ▼
                                                  Dynamic Priority Scoring (0-100)
                                                                 │
                                                                 ▼
[ MCD Official Portal ] ◄── Priority Triage Desk ◄── Real-Time Incident Clustering
           │
           ▼
[ Resolution Action ] ──► Live After-Repair Proof ──► Forensic GPS Watermarking
                                                                 │
                                                                 ▼
[ Citizen Verification ] ◄── Interactive Before/After ──► Community Vote YES / NO
```

---

## 🔑 Demo Access Credentials

Both portals include **1-click Quick-Fill** demo login buttons:

| Portal | Role | Demo Email | Password | Permissions & Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen Portal** | `citizen` | `priya.singh@gmail.com` | `password123` | File geotagged reports, browse Ward-04 feed, audit repairs with Before/After swipe slider, vote YES/NO. |
| **MCD Official Portal** | `official` | `official1@mcd.gov.in` | `admin123` | Inspect priority triage queue, review duplicate clusters, dispatch municipal crews, upload live repair proof. |

---

## 🚀 Key Features

* **AI Zero-Shot Vision Triage**: Automatically classifies civic hazards across 7 categories:
  * `pothole` (Potholes & Craters)
  * `waterlogging` (Drainage & Monsoon Flooding)
  * `garbage` (Solid Waste Dumps & Litter)
  * `road_damage` (Structural Bitumen Cracks)
  * `electrical_streetlight_hazard` (Exposed Cables & Broken Streetlights)
  * `fallen_obstruction` (Fallen Trees & Storm Debris)
  * `infrastructure_damage` (Open Manhole Chambers & Broken Pavement)
* **Spatial + Visual Deduplication Engine**: Detects duplicate filings within a 50-meter radius using **PostGIS** `ST_DWithin` and **pgvector** cosine distance (`<=>`), merging duplicate filings into a single master incident and boosting priority score rather than creating duplicate work orders.
* **Closed-Loop Verification**: MCD engineers must submit photographic evidence of the resolved site. The issue transitions to `RESOLVED_PENDING_VERIFICATION`, prompting citizens to vote YES (Fixed) or NO (Reopen).
* **Forensic EXIF GPS Watermarking**: Injects live timestamp, latitude, longitude, and municipal audit metadata directly onto uploaded resolution photos.
* **Bilingual Support**: Instant toggle between **English** and **Hindi (हिन्दी)** with context-aware translations.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Custom Design Tokens & Apple-inspired CSS.
* **Backend**: FastAPI, Python 3.10+, PyTorch, Hugging Face Transformers (`openai/clip-vit-base-patch32`), Pillow.
* **Database**: PostgreSQL 15+ with **PostGIS** and **pgvector** extensions (hosted on Supabase).
* **Deployment**: Vercel (Frontend SPA) + Render (Backend Web Service).

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/KalashMaheshwari/civicfix.git
cd civicfix
```

### 2. Configure Environment Variables
Create `.env` in the root directory:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET_KEY=civicfix-super-secure-secret-key-prod-2026-auth
PROJECT_NAME="CivicFix Backend"
API_V1_STR=/api/v1
```

### 3. Run Database Migrations & Seed Demo Data
```bash
# Apply schema, PostGIS, pgvector extensions, and tables
python backend/db/migrate.py

# Sync demo credentials and load curated demo issues
python -m backend.db.sync_all_demo_logins
python -m backend.db.seed_curated_demo_issues
```

### 4. Install Dependencies & Start Services

**Terminal 1 — Backend API**:
```bash
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Visit:
* **Citizen Portal**: [http://localhost:5173/](http://localhost:5173/)
* **MCD Official Portal**: [http://localhost:5173/gov/login](http://localhost:5173/gov/login)
* **FastAPI Interactive Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Repository Structure

```
civicfix/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py              # Citizen & MCD Official Auth routes
│   │   │   └── complaints.py        # Triage, Reports, Resolve, and Vote routes
│   │   ├── core/                    # Config, security, and RBAC dependencies
│   │   ├── db/                      # PostgreSQL connection pooling & query layer
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── detector.py          # Lazy-loaded CLIP Vision Classifier
│   │   │   └── triage.py            # Deduplication & dynamic priority calculation
│   │   └── main.py                  # FastAPI entrypoint & health probe
│   └── db/
│       ├── migrate.py               # PostGIS & pgvector schema migration
│       ├── seed_curated_demo_issues.py # Custom demo issue seeder
│       └── sync_all_demo_logins.py  # User auth synchronizer
├── frontend/
│   ├── public/
│   │   ├── demo issues/             # Real civic hazard & resolved repair photos
│   │   └── bento/                   # Category graphics
│   ├── src/
│   │   ├── components/              # Incident cards, sliders, ledger tables, modals
│   │   ├── context/                 # AuthContext & LanguageContext (EN/HI)
│   │   ├── pages/                   # Citizen Feed, Report Flow, MCD Console
│   │   ├── services/                # Axios/Fetch API client & telemetry
│   │   └── styles/                  # Clean modern design system
│   └── vercel.json                  # SPA routing configuration
└── requirements.txt                 # Backend dependencies
```

---

## 📄 License

MIT License.
