from pathlib import Path
import sys
root=Path(".")
forbidden=["61997","studio-dev.genlayer.com","studioDevnet"]
allow={"README.md","docs/TOOLCHAIN.md","docs/SECURITY.md","scripts/repository_integrity.py","scripts/check-network.mjs"}
viol=[]
for p in root.rglob("*"):
    if not p.is_file() or any(x in p.parts for x in ("node_modules",".git",".next")): continue
    rel=p.as_posix()
    try:s=p.read_text()
    except: continue
    if rel not in allow:
        for token in forbidden:
            if token in s: viol.append((rel,token))
if viol: print(viol); sys.exit(1)
assert 'chainId:61999' in Path("apps/web/lib/config.ts").read_text()
assert 'https://studio.genlayer.com/api' in Path("apps/web/lib/config.ts").read_text()
print("Repository integrity OK")
