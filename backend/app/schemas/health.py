from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ComponentStatus(BaseModel):
    status: str = Field(..., description="ONLINE, OFFLINE, SIMULATION, NOT CONFIGURED, ERROR")
    details: Optional[str] = None
    latency_ms: Optional[float] = None

class HealthResponse(BaseModel):
    status: str = Field(..., description="healthy, degraded, or unhealthy")
    version: str = "1.0.0"
    uptime_seconds: float
    components: Dict[str, ComponentStatus]

class SystemStatusResponse(BaseModel):
    system_name: str = "Megathon 2026 Multi-Modal Drone Detection Platform"
    status: str
    mode: str = Field(..., description="LIVE or DEMO")
    active_target_id: Optional[str] = None
    components: Dict[str, ComponentStatus]
