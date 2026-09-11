"""Root entrypoint for Megathon 2026 System Validation."""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT / "validation"))

from validate import MasterSystemValidator

if __name__ == "__main__":
    validator = MasterSystemValidator()
    success = validator.run_all()
    sys.exit(0 if success else 1)
