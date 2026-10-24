"""Write the sample bank statement to ../demo/bank-statement-demo.csv, with dates relative to today.

    cd backend && python scripts/generate_demo_csv.py
"""
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app.services.demo_statement import build_statement  # noqa: E402

target = BACKEND.parent / "demo" / "bank-statement-demo.csv"
target.parent.mkdir(exist_ok=True)
target.write_text(build_statement(), encoding="utf-8", newline="\n")
print(f"{target} written ({len(target.read_text(encoding='utf-8').splitlines()) - 1} rows)")
