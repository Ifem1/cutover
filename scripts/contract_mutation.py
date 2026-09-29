from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "contracts" / "core_logic.py"
source = SOURCE_PATH.read_text()

# Consequential deterministic mutants. Pattern absence is a hard failure so the
# harness cannot silently drift away from the source it claims to challenge.
mutants = {
    "material_change_passes": (
        "BLOCKING = {RuleStatus.MATERIAL_CHANGE, RuleStatus.MISSING, RuleStatus.BROKEN}",
        "BLOCKING = {RuleStatus.MISSING, RuleStatus.BROKEN}",
    ),
    "unreadable_passes": (
        "UNCERTAIN = {RuleStatus.CONFLICTING, RuleStatus.UNREADABLE}\nPASSING = {RuleStatus.PRESERVED, RuleStatus.ALLOWED_CHANGE}",
        "UNCERTAIN = {RuleStatus.CONFLICTING}\nPASSING = {RuleStatus.PRESERVED, RuleStatus.ALLOWED_CHANGE, RuleStatus.UNREADABLE}",
    ),
    "source_failure_passes": (
        "if not evidence_available or not source_match or any(v in UNCERTAIN for v in values):",
        "if False or not source_match or any(v in UNCERTAIN for v in values):",
    ),
    "missing_route_assessment_passes": (
        "if assessed_count!=required_count or required_count==0:",
        "if False or required_count==0:",
    ),
    "ignore_generation": (
        "and assessed_generation==current_generation",
        "and True",
    ),
    "ignore_challenge": (
        "and not challenge_open",
        "and True",
    ),
    "ignore_deadline": (
        "and now>=review_deadline",
        "and True",
    ),
    "ignore_ref": (
        "and (authorized_ref is None or authorized_ref==candidate_ref)",
        "and True",
    ),
    "second_challenge_allowed": (
        "challenge_used_generation!=current_generation",
        "True",
    ),
    "late_challenge_allowed": (
        "now<review_deadline",
        "True",
    ),
}

bad = []
for name, (old, new) in mutants.items():
    if old not in source:
        bad.append(name + ":pattern-missing")
        continue
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        shutil.copytree(ROOT / "contracts", d / "contracts")
        shutil.copytree(ROOT / "tests", d / "tests")
        mutated = source.replace(old, new, 1)
        if mutated == source:
            bad.append(name + ":not-mutated")
            continue
        (d / "contracts" / "core_logic.py").write_text(mutated)
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", str(d / "tests" / "unit")],
            cwd=d, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        if proc.returncode == 0:
            bad.append(name + ":survived")

if bad:
    print(*bad, sep="\n")
    raise SystemExit(1)
print(f"Killed {len(mutants)}/{len(mutants)} meaningful contract mutants")
