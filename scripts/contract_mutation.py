from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "contracts" / "core_logic.py"
source = SOURCE_PATH.read_text()

# Each mutation must alter a consequential deterministic invariant and be killed
# by the ordinary unit suite. Pattern absence is itself a failure so this harness
# cannot silently drift away from the code it is supposed to challenge.
mutants = {
    "material_change_passes": (
        "BLOCKING = {RuleStatus.MATERIAL_CHANGE, RuleStatus.MISSING, RuleStatus.BROKEN}",
        "BLOCKING = {RuleStatus.MISSING, RuleStatus.BROKEN}",
    ),
    "unreadable_passes": (
        "UNCERTAIN = {RuleStatus.CONFLICTING, RuleStatus.UNREADABLE}\nPASSING = {RuleStatus.PRESERVED, RuleStatus.ALLOWED_CHANGE}",
        "UNCERTAIN = {RuleStatus.CONFLICTING}\nPASSING = {RuleStatus.PRESERVED, RuleStatus.ALLOWED_CHANGE, RuleStatus.UNREADABLE}",
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
            cwd=d,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if proc.returncode == 0:
            bad.append(name + ":survived")

if bad:
    print(*bad, sep="\n")
    raise SystemExit(1)

print(f"Killed {len(mutants)}/{len(mutants)} meaningful contract mutants")
