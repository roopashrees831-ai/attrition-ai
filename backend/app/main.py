import os
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.api.endpoints import (
    auth,
    datasets,
    models,
    predictions,
    companies,
)
from app.services.seed_data import seed_database


# ============================================================
# DATABASE
# ============================================================

# Create database tables immediately.
# Do NOT block FastAPI startup with ML training.
Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="ATTRITION AI",
    description="Multi-company Employee Attrition Prediction Platform",
    version="1.0.0",
)


# ============================================================
# BACKGROUND DATABASE / ML INITIALIZATION
# ============================================================

def seed_in_background():
    """
    Load seed data and prepare ML models in the background.

    This allows Render to open the web port quickly while
    the database and models are initialized.
    """
    try:
        print("[INFO] Starting database seeding in background...")
        seed_database()
        print("[INFO] Database seeding completed successfully.")
    except Exception as exc:
        print(f"[WARN] Background database seeding failed: {exc}")


@app.on_event("startup")
def start_background_seed():
    """
    Start database/model initialization without blocking FastAPI startup.
    """
    thread = threading.Thread(
        target=seed_in_background,
        daemon=True,
    )
    thread.start()
    print("[INFO] Background initialization started.")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(auth.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "service": "ATTRITION AI",
        "ml_engine": "Active",
        "prediction_service": "Online",
        "data_pipeline": "Ready",
    }


# ============================================================
# FRONTEND BUILD LOCATION
# ============================================================

# main.py is:
#   attrition-ai/backend/app/main.py
#
# Therefore parents[2] is the repository root:
#   attrition-ai/
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
ASSETS_DIR = FRONTEND_DIST / "assets"

print(f"[INFO] Project root: {PROJECT_ROOT}")
print(f"[INFO] Frontend dist: {FRONTEND_DIST}")
print(f"[INFO] Frontend dist exists: {FRONTEND_DIST.exists()}")
print(f"[INFO] Assets dir exists: {ASSETS_DIR.exists()}")


# ============================================================
# SERVE VITE / REACT ASSETS
# ============================================================

# Vite production index.html loads CSS/JS from /assets/...
# Mount the generated assets directory directly so CSS and JS
# are served as real static files with the correct MIME types.
if ASSETS_DIR.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(ASSETS_DIR)),
        name="assets",
    )
else:
    print(
        "[WARN] frontend/dist/assets was not found. "
        "Run 'npm run build' before starting the server."
    )


# ============================================================
# SERVE REACT SPA
# ============================================================

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Serve built React files and fall back to index.html for
    React Router routes such as /login, /dashboard and /predictions.
    """

    # API URLs must never fall back to React.
    if full_path.startswith("api/"):
        raise HTTPException(
            status_code=404,
            detail="API route not found",
        )

    # Resolve requested path safely inside frontend/dist.
    requested_file = (FRONTEND_DIST / full_path).resolve()

    try:
        requested_file.relative_to(FRONTEND_DIST.resolve())
        safe_path = True
    except ValueError:
        safe_path = False

    # Serve real files from dist (favicon, manifest, etc.).
    if (
        full_path
        and safe_path
        and requested_file.is_file()
    ):
        return FileResponse(
            str(requested_file),
            headers={
                "Cache-Control": "no-cache",
            },
        )

    # React SPA fallback.
    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        # Do not cache index.html on Render. This prevents the browser
        # from keeping an older HTML file that points to old CSS/JS hashes.
        return FileResponse(
            str(index_file),
            media_type="text/html",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )

    return {
        "message": (
            "Frontend build not found. "
            "Run 'cd frontend && npm install && npm run build' first."
        )
    }


# ============================================================
# LOCAL / RENDER START
# ============================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
