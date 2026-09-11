"""Radar API endpoints."""
from fastapi import APIRouter, HTTPException

from backend.app.schemas.radar import RadarStatusResponse, RadarTargetsResponse
from backend.app.services.radar_service import radar_service

router = APIRouter()


@router.get("/status", response_model=RadarStatusResponse)
async def radar_status():
    return radar_service.get_status()


@router.get("/targets")
async def radar_targets(target_type: str = "drone"):
    """Get current radar targets. All data is SIMULATED."""
    return radar_service.get_targets(target_type=target_type)


@router.get("/targets/{target_type}")
async def radar_targets_type(target_type: str):
    """Get radar targets for a specific type (drone, bird, airplane, clutter)."""
    return radar_service.get_targets(target_type=target_type)


@router.get("/track/{target_id}")
async def radar_track(target_id: str):
    """Get track history for a specific target."""
    return radar_service.get_track(target_id)
