"""Megathon 2026 — Multi-Modal Drone Detection Platform.

FastAPI backend providing REST APIs for:
- RF classification (real ML inference)
- Vision detection (NOT CONFIGURED / simulation)
- Radar tracking (SIMULATION)
- Sensor fusion (three-state decision engine)
- System health monitoring
"""
import os
import sys
import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the repo root and src/ are importable
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SRC_DIR = REPO_ROOT / "src"
for p in [str(REPO_ROOT), str(SRC_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Set CWD to repo root so relative model paths resolve
os.chdir(str(REPO_ROOT))

from backend.app.api import health, rf, vision, radar, fusion, events, console

app = FastAPI(
    title="Megathon 2026 — Multi-Modal Drone Detection Platform",
    description="RADAR + COMPUTER VISION + RF CLASSIFICATION + SENSOR FUSION",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(rf.router, prefix="/api/rf", tags=["RF"])
app.include_router(vision.router, prefix="/api/vision", tags=["Vision"])
app.include_router(radar.router, prefix="/api/radar", tags=["Radar"])
app.include_router(fusion.router, prefix="/api/fusion", tags=["Fusion"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(console.router, prefix="/api", tags=["Console (PS3)"])


@app.get("/")
async def root():
    return {
        "name": "Megathon 2026 — Multi-Modal Drone Detection Platform",
        "docs": "/docs",
        "api": {
            "health": "/api/health",
            "rf_predict": "POST /api/rf/predict",
            "vision_predict": "POST /api/vision/predict",
            "radar_status": "GET /api/radar/status",
            "radar_targets": "GET /api/radar/targets",
            "fusion_predict": "POST /api/fusion/predict",
            "demo": "POST /api/fusion/demo",
            "events": "GET /api/events",
        },
    }
