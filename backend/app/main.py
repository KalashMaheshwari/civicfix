import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.db.supabase_client import get_supabase
from backend.app.db.postgres_direct import get_connection_pool

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up PostgreSQL connection pool proactively on app startup
    try:
        pool = get_connection_pool()
        if pool:
            logging.info("PostgreSQL connection pool ready.")
    except Exception as e:
        logging.warning(f"DB pool warmup notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Civic Issue Intelligence & Municipal Accountability Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Enable CORS for React Vite Dev Server (port 5173) & external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Directories
os.makedirs("uploaded_images", exist_ok=True)

app.mount("/uploaded_images", StaticFiles(directory="uploaded_images"), name="uploaded_images")

# Serve Built React Frontend if dist exists
dist_dir = os.path.join("frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")


@app.get("/health", tags=["General"])
def health():
    db_status = "error"
    db_latency_ms = None
    try:
        from backend.app.db.postgres_direct import get_db_cursor
        import time
        t0 = time.time()
        with get_db_cursor() as cur:
            if cur:
                cur.execute("SELECT 1 AS probe;")
                res = cur.fetchone()
                if res and res.get("probe") == 1:
                    db_status = "connected (Supabase PostGIS)"
                    db_latency_ms = round((time.time() - t0) * 1000, 2)
    except Exception as e:
        db_status = f"connection error: {e}"

    ai_status = "CLIP Vision Engine (openai/clip-vit-base-patch32, zero-overhead lazy load)"

    logging.info(f"[Health Probe] DB Status: {db_status} ({db_latency_ms}ms) | AI: {ai_status}")

    return {
        "status": "healthy",
        "database": db_status,
        "database_latency_ms": db_latency_ms,
        "ai_vision_model": ai_status,
        "version": "1.0.0"
    }


@app.get("/{full_path:path}", tags=["UI"])
def serve_react_app(full_path: str = ""):
    # If route matches API or static docs, skip
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("health"):
        return {"status": "not found"}

    dist_index = os.path.join("frontend", "dist", "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)

    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "message": "React production bundle not built yet. Run 'npm run dev' inside frontend/ or 'npm run build'."
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logging.info(f"Starting Uvicorn server on port {port}...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, log_level="info")