from pathlib import Path
from hashlib import sha256
p=Path("contracts/cutover.py")
print("repository_contract_sha256="+sha256(p.read_bytes()).hexdigest())
print("Live deployment/source comparison: NOT YET RUN")
