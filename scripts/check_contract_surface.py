import ast
import json
from pathlib import Path

src=Path("contracts/cutover.py").read_text()
tree=ast.parse(src)
surface=json.loads(Path("contracts/surface.json").read_text())
contract=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=="Cutover")
methods={n.name:[a.arg for a in n.args.args if a.arg!="self"] for n in contract.body if isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef))}

bad=[]
for group in ("writes","views"):
    for name,args in surface[group].items():
        if name not in methods: bad.append(f"{name}:missing")
        elif methods[name]!=args: bad.append(f"{name}: expected {args}, got {methods[name]}")
if bad:
    raise SystemExit("Contract surface mismatch:\n" + "\n".join(bad))
print("Contract surface OK:",len(surface["writes"]),"writes,",len(surface["views"]),"views")
