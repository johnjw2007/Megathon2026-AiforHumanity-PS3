"""Radar Service — wraps the simulated radar sensor with multiple targets.

All radar data is SIMULATED. No real radar hardware is connected.
"""
import time
from typing import Dict, Any, List

from radar.radar_simulator import SimulatedRadarSensor, TARGET_CONFIGS


class RadarService:
    """Radar tracking service (SIMULATION) with multiple targets."""

    def __init__(self):
        self._sim = SimulatedRadarSensor(update_rate_hz=2.0, rng_seed=42)

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "SIMULATION",
            "update_rate_hz": self._sim.update_rate_hz,
            "mode": "simulated",
            "tracked_targets": len(self._sim._targets),
            "note": "No real radar hardware connected. Data is SIMULATED.",
        }

    def get_targets(self, target_type: str = "all") -> Dict[str, Any]:
        """Get all radar targets with metadata and colors."""
        # Scan to update positions
        detections = self._sim.scan()
        
        # Get target metadata with colors
        target_metadata = self._sim.get_targets()
        
        # Merge detection data with metadata
        targets = []
        for det, meta in zip(detections, target_metadata):
            d = det.to_dict()
            d["source"] = "SIMULATED_RADAR"
            d["color"] = meta["color"]
            d["symbol"] = meta["symbol"]
            d["label"] = meta["label"]
            d["type"] = meta["type"]
            targets.append(d)
        
        return {
            "targets": targets,
            "source": "SIMULATED_RADAR",
            "note": "All radar data is SIMULATED. No live hardware.",
        }

    def get_track(self, target_id: str) -> List[Dict[str, Any]]:
        from dataclasses import asdict
        points = self._sim.get_track(target_id)
        return [asdict(p) for p in points]

    def scan_for_type(self, target_type: str = "drone") -> Dict[str, Any]:
        """Generate a scan for a specific target type."""
        det = self._sim.generate_target_state(target_type=target_type)
        d = det.to_dict()
        d["source"] = "SIMULATED_RADAR"
        cfg = TARGET_CONFIGS.get(target_type, TARGET_CONFIGS["unknown"])
        d["color"] = cfg["color"]
        d["symbol"] = cfg["symbol"]
        d["label"] = cfg["label"]
        d["type"] = target_type
        return {
            "targets": [d],
            "source": "SIMULATED_RADAR",
            "note": "All radar data is SIMULATED. No live hardware.",
        }


radar_service = RadarService()
