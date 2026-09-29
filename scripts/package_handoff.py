from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]; out=root/"cutover-chatgpt-pro-handoff.zip"
exclude={".git","node_modules",".next","__pycache__",".pytest_cache","dist","coverage"}
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
    for p in root.rglob("*"):
        if p==out or any(part in exclude for part in p.parts) or not p.is_file(): continue
        z.write(p,p.relative_to(root))
print(out)
