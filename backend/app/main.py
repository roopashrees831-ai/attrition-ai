import os
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.api.endpoints import (
    auth,
    datasets,
    models,
    predictions,
    companies
)
from app.services.seed_data import seed_database


# ============================================================
# DATABASE
# ============================================================

# Create database tables immediately.
# Do NOT run ML training here because Render needs the
# web server to open its port quickly.
Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="ATTRITION AI",
    description="Multi-company Employee Attrition Prediction Platform",
    version="1.0.0"
)


# ============================================================
# BACKGROUND DATABASE / ML INITIALIZATION
# ============================================================

def seed_in_background():
    """
    Load seed data and prepare ML models in the background.

    This prevents Render deployment from waiting for model
    training before the FastAPI server opens its port.
    """

    try:
        print("[INFO] Starting database seeding in background...")

        seed_database()

        print("[INFO] Database seeding completed successfully.")

    except Exception as e:
        print(
            f"[WARN] Background database seeding failed: {e}"
        )


@app.on_event("startup")
def start_background_seed():
    """
    Start database/model initialization without blocking
    FastAPI startup.
    """

    thread = threading.Thread(
        target=seed_in_background,
        daemon=True
    )

    thread.start()

    print(
        "[INFO] Background initialization started."
    )


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

app.include_router(
    auth.router,
    prefix="/api/v1"
)

app.include_router(
    datasets.router,
    prefix="/api/v1"
)

app.include_router(
    models.router,
    prefix="/api/v1"
)

app.include_router(
    predictions.router,
    prefix="/api/v1"
)

app.include_router(
    companies.router,
    prefix="/api/v1"
)


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
        "data_pipeline": "Ready"
    }


# ============================================================
# FRONTEND BUILD LOCATION
# ============================================================

frontend_dist = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../frontend/dist"
    )
)

assets_dir = os.path.join(
    frontend_dist,
    "assets"
)


# ============================================================
# SERVE FRONTEND ASSETS
# ============================================================

if os.path.exists(assets_dir):
    app.mount(
        "/assets",
        StaticFiles(
            directory=assets_dir
        ),
        name="assets"
    )


# ============================================================
# SERVE REACT APP
# ============================================================

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):

    # Do not interfere with API routes
    if full_path.startswith("api/"):
        raise HTTPException(
            status_code=404,
            detail="API route not found"
        )

    # Requested frontend file
    requested_file = os.path.join(
        frontend_dist,
        full_path
    )

    # Serve actual frontend file when available
    if (
        full_path
        and
        os.path.isfile(requested_file)
    ):
        return FileResponse(
            requested_file
        )

    # React SPA fallback
    index_file = os.path.join(
        frontend_dist,
        "index.html"
    )

    if os.path.exists(index_file):
        return FileResponse(
            index_file
        )

    return {
        "message":
        "Frontend build not found. Run npm run build first."
    }


# ============================================================
# LOCAL / RENDER START
# ============================================================

if __name__ == "__main__":

    import uvicorn

    port = int(
        os.environ.get(
            "PORT",
            8000
        )
    )

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )