"""Hackathon CLI entrypoint supporting 'hackathon validate' and 'hackathon demo'."""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(REPO_ROOT / "validation"))
sys.path.insert(0, str(REPO_ROOT / "src"))

def main():
    args = sys.argv[1:]
    command = args[0] if args else "validate"
    
    if command == "validate":
        from validate import MasterSystemValidator
        v = MasterSystemValidator()
        sys.exit(0 if v.run_all() else 1)
    elif command == "demo":
        from demo_scenarios import run_all_scenarios
        res = run_all_scenarios()
        sys.exit(0 if res["all_passed"] else 1)
    elif command in ("ui", "dashboard"):
        import subprocess
        subprocess.run([sys.executable, str(REPO_ROOT / "demo_app.py")])
    else:
        print(f"Unknown command: {command}. Available: validate, demo, ui")
        sys.exit(1)

if __name__ == "__main__":
    main()
