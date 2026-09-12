import os
import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.db.supabase_client import get_supabase
from backend.app.db.postgres_direct import get_connection_pool

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

FIELD_LABELS = {
    "full_name": "Full Name",
    "email": "Email Address",
    "password": "Password",
    "phone": "Phone Number",
    "department": "Department",
    "official_badge_id": "Official Badge ID",
    "latitude": "Latitude",
    "longitude": "Longitude",
    "address": "Address",
    "description": "Description",
    "file": "Photo Evidence",
    "is_fixed": "Resolution Status",
    "comment": "Dispute / Feedback Notes",
}

def format_validation_error(err: dict) -> str:
    loc = err.get("loc", [])
    filtered_loc = [str(x) for x in loc if str(x) not in ("body", "query", "path", "header", "formData")]
    field_key = filtered_loc[-1] if filtered_loc else "field"
    field_lower = field_key.lower()
    err_type = str(err.get("type", "")).lower()
    ctx = err.get("ctx", {}) or {}
    raw_msg = str(err.get("msg", "")).lower()

    # Field-specific humanized messages
    if field_lower == "password":
        if "string_too_short" in err_type or "at least" in raw_msg or "min_length" in ctx:
            min_len = ctx.get("min_length", 6)
            return f"Password must be at least {min_len} characters long."
        if "missing" in err_type or "required" in raw_msg:
            return "Please enter your password."
        return "Please enter a valid password (at least 6 characters)."

    if field_lower == "email":
        if "missing" in err_type or "required" in raw_msg:
            return "Please enter your email address."
        return "Please enter a valid email address."

    if field_lower in ("full_name", "fullname"):
        if "string_too_short" in err_type or "at least" in raw_msg:
            return "Full name must be at least 2 characters."
        if "missing" in err_type or "required" in raw_msg:
            return "Please enter your full name."
        return "Please enter your full name."

    if field_lower == "official_badge_id":
        return "Please enter your official badge or employee ID."

    if field_lower == "department":
        return "Please select your municipal department."

    if field_lower == "file":
        return "Please upload a photo of the civic issue (JPEG, PNG, or WEBP)."

    if field_lower in ("latitude", "longitude"):
        return "Please provide valid GPS coordinates."

    if field_lower == "address":
        return "Please provide a street address or landmark."

    field_label = FIELD_LABELS.get(field_key, field_key.replace("_", " ").title())

    if "string_too_short" in err_type or "at least" in raw_msg:
        min_len = ctx.get("min_length", 2)
        return f"{field_label} must be at least {min_len} characters long."

    if "string_too_long" in err_type or "at most" in raw_msg:
        max_len = ctx.get("max_length", 100)
        return f"{field_label} cannot exceed {max_len} characters."

    if "missing" in err_type or "required" in raw_msg:
        return f"Please enter your {field_label.lower()}."

    return f"Please provide a valid {field_label.lower()}."

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

# Exception handler for Pydantic / FastAPI request validation errors (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        formatted = [format_validation_error(e) for e in errors]
        clean_msg = " ".join(formatted)
    else:
        clean_msg = "Please check all required form inputs and try again."

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": clean_msg, "message": clean_msg}
    )

# Exception handler for standard HTTP exceptions (400, 401, 403, 404, 500, etc.)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, list):
        clean_detail = " ".join(str(d) for d in detail)
    elif isinstance(detail, dict):
        clean_detail = detail.get("detail") or detail.get("message") or detail.get("msg") or str(detail)
    else:
        clean_detail = str(detail)

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": clean_detail, "message": clean_detail}
    )

# Global fallback exception handler for unexpected server errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Internal server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    clean_msg = "An unexpected server error occurred. Please try again shortly."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": clean_msg, "message": clean_msg}
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