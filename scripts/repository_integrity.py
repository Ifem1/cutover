from pathlib import Path
import json, re, sys

root=Path(".")
forbidden_runtime=["61997","studio-dev.genlayer.com","studioDevnet"]
runtime_allow={"README.md","docs/TOOLCHAIN.md","docs/SECURITY.md","scripts/repository_integrity.py","scripts/check-network.mjs"}
viol=[]
for p in root.rglob("*"):
    if not p.is_file() or any(x in p.parts for x in ("node_modules",".git",".next")): continue
    rel=p.as_posix()
    try: text=p.read_text()
    except UnicodeDecodeError: continue
    if rel not in runtime_allow:
        for token in forbidden_runtime:
            if token in text: viol.append((rel,token))
    if rel.startswith(("apps/web/","packages/gate/")) and "/tests/" not in rel:
        if "127.0.0.1" in text or "localhost" in text: viol.append((rel,"localhost production config"))
    if rel not in {".env.example"} and not rel.startswith(("docs/","proof/")):
        if re.search(r"(?i)(private[_-]?key|mnemonic|seed[_-]?phrase)\s*[:=]\s*['\"]?[A-Za-z0-9+/=_-]{20,}",text):
            viol.append((rel,"possible secret/private key"))
if viol:
    print("Repository integrity violations:",*viol,sep="\n")
    sys.exit(1)

config=Path("apps/web/lib/config.ts").read_text()
assert 'chainId:61999' in config
assert 'https://studio.genlayer.com/api' in config
assert 'https://explorer-studio.genlayer.com' in config
assert 'createAccount(' not in "\n".join(p.read_text(errors="ignore") for p in Path("apps/web").rglob("*.ts*"))

requirements=Path("requirements.txt").read_text()
assert "genlayer-py@v0.16.3" in requirements\nassert "genlayer-testing-suite@v0.29.2" in requirements
assert "genvm-linter@v0.11.0" in requirements
assert "@main" not in requirements and "-rc" not in requirements.lower()

root_package=json.loads(Path("package.json").read_text())
assert root_package["devDependencies"]["genlayer"]=="0.39.1"
web_package=json.loads(Path("apps/web/package.json").read_text())
assert web_package["dependencies"]["genlayer-js"]=="1.1.8"

contract=Path("contracts/cutover.py").read_text()
assert "def derive_candidate(self,migration_id:int)" in contract
assert "def authorize(self,migration_id:int)" in contract
assert "now_ts" not in contract
assert 'from datetime import datetime' in contract
assert 'baseline_snapshot' in contract and 'FROZEN_BASELINE:' in contract
assert 'CUTOVER observation stage' in contract and 'CUTOVER comparison stage' in contract

surface=json.loads(Path("contracts/surface.json").read_text())
assert surface["writes"]["authorize"]==["migration_id"]
assert surface["writes"]["derive_candidate"]==["migration_id"]

matrix=json.loads(Path("proof/matrix.json").read_text())
assert matrix["network"]=={"name":"studionet","chain_id":61999}
assert len(matrix["invariants"])>=10
for row in matrix["invariants"]:
    assert row["live_transaction"]=="NOT YET RUN", row["id"]

print("Repository integrity OK")
