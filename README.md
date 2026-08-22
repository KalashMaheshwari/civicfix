# CivicFix — Municipal Intelligence & Accountability Platform

CivicFix is an AI-powered civic issue triage, deduplication, and municipal accountability platform. It features strict role-based access control (RBAC), OpenAI CLIP visual hazard detection, PostGIS + pgvector spatial-visual clustering, and a modern Apple-inspired React frontend.

---

## Architecture Overview

```
[ Citizen Portal ] ──► Upload Photo + GPS ──► OpenAI CLIP Zero-Shot (512-d Embedding)
                                                          │
                                                          ▼
                                            PostgreSQL / Supabase Engine
                                      • PostGIS (Distance <= 50m)
                                      • pgvector (Cosine Similarity >= 0.85)
                                                          │
                                                          ▼
                                             Priority Score & Clustering
                                                          │
                                                          ▼
[ MCD Official Portal ] ◄── Triage Queue ──► Upload After-Repair Photo Proof
                                                          │
                                                          ▼
[ Citizen Verification ] ◄── Before vs. After ──► Vote YES (Fixed) / NO (Broken)
```

---

## Features

* **Dual Role-Based Portals**:
  * **Citizen Portal (`/`)**: Report issues with GPS detection, view community hazard feed, and verify completed repairs.
  * **MCD Official Portal (`/gov/login`)**: Priority triage dashboard, dispatch queues, and after-repair verification uploads.
* **AI Hazard Detection & Clustering**: OpenAI CLIP vision model categorizes infrastructure hazards and prevents duplicate report flooding.
* **Closed-Loop Accountability**: MCD repairs require a post-repair photograph, which is sent back to the community for YES/NO citizen verification.
* **Cryptographic Security**: PBKDF2-HMAC-SHA256 password hashing and signed JWT Bearer tokens with route guards (`401`/`403`).

---

## Prerequisites

Before getting started, make sure you have the following installed:

1. **Python 3.10+**
2. **Node.js 18+** & **npm**
3. **PostgreSQL Database** with PostGIS and pgvector (or a free [Supabase](https://supabase.com) project)

---

## Local Setup & Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/KalashMaheshwari/civicfix.git
cd civicfix
```

---

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
# PostgreSQL Connection (e.g. Supabase or local PostgreSQL with pgvector)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# JWT Secret Key
JWT_SECRET_KEY=civicfix-super-secure-secret-key-prod-2026-auth

# Project Settings
PROJECT_NAME=CivicFix
API_V1_STR=/api/v1
```

---

### 3. Setup the Database Schema
Run the database migration script to apply PostGIS, pgvector extensions, tables, triggers, and RPC functions:

```bash
python backend/db/migrate.py
```

---

### 4. Install Python Backend Dependencies
```bash
pip install -r requirements.txt
```

---

### 5. Install Frontend Dependencies & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Running the Application Locally

### Option A: Unified Full-Stack Mode (FastAPI serves built React bundle)

1. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.app.main:app --reload --port 8000
   ```

2. Open your browser:
   * **Citizen Portal**: [http://localhost:8000/](http://localhost:8000/)
   * **MCD Government Portal**: [http://localhost:8000/gov/login](http://localhost:8000/gov/login)
   * **Interactive API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Live Hot-Reload Dev Mode (Vite Dev Server + FastAPI)

Run backend and frontend concurrently in two separate terminal windows:

**Terminal 1 (Backend API)**:
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 (React Vite Dev Server)**:
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) (Vite automatically proxies `/api` and `/uploaded_images` requests to `:8000`).

---

## Demo Accounts

Both authentication screens include a **1-click "Auto-fill"** demo button:

| Portal | Demo Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Citizen Portal** | `priya.singh@gmail.com` | `password123` | Report issues, view community feed, vote YES/NO |
| **MCD Official Portal** | `verma.mcd@delhi.gov.in` | `password123` | Triage queue, dispatch teams, upload repair proof photos |

---

## Running Automated Tests

To run the backend RBAC security and AI classification test suite:

```bash
# Test AI detector
python backend/test_detector.py

# Test API endpoints & RBAC guards
python -c "from fastapi.testclient import TestClient; from backend.app.main import app; c = TestClient(app); print('Root:', c.get('/').status_code); print('API:', c.get('/api/v1/complaints/incidents').status_code)"
```

---

## Project Structure

```
civicfix/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── endpoints/
│   │   │       ├── auth.py             # Citizen & MCD Official Auth routes
│   │   │       └── complaints.py       # Triage, Reports, Resolve, and Vote routes
│   │   ├── core/
│   │   │   ├── config.py               # Pydantic environment configuration
│   │   │   ├── deps.py                 # FastAPI RBAC dependencies & token guards
│   │   │   └── security.py             # PBKDF2-HMAC-SHA256 password hashing & JWT
│   │   ├── db/
│   │   │   ├── postgres_direct.py      # Direct PostgreSQL + pgvector query repository
│   │   │   └── supabase_client.py      # Supabase client wrapper
│   │   ├── schemas/
│   │   │   └── complaint.py            # Pydantic models for complaints & feedback
│   │   ├── services/
│   │   │   ├── detector.py             # OpenAI CLIP zero-shot classification
│   │   │   └── triage.py               # Deduplication & dynamic priority scoring
│   │   └── main.py                     # FastAPI application entrypoint
│   └── db/
│       ├── migrate.py                  # Database migration runner
│       └── schema.sql                  # PostgreSQL / Supabase SQL schema
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable React components
│   │   ├── context/                    # AuthContext & state management
│   │   ├── pages/                      # Citizen & MCD Official pages
│   │   ├── services/                   # Typed API service client
│   │   ├── styles/                     # Apple-inspired CSS design system
│   │   └── types/                      # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts                  # Vite configuration & API proxy
├── uploaded_images/                    # Local storage directory for report photos
├── requirements.txt                    # Python dependencies
└── README.md                           # Documentation
```

---

## License

MIT License.
