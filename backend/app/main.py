from fastapi import FastAPI

app = FastAPI(
    title="CivicAI Backend",
    description="AI-Powered Civic Issue Intelligence & Accountability Platform",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "CivicAI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }