"""Pure deterministic CUTOVER logic shared by tests and mutation tooling."""
from __future__ import annotations
from enum import Enum
from hashlib import sha256
import json
from typing import Iterable

MAX_ROUTES = 24
MAX_RULES_PER_ROUTE = 12
MAX_TEXT = 12000
MAX_HEADINGS = 24
MAX_LINKS = 32
MAX_FORMS = 16
MAX_CLAIMS = 32
MAX_URL = 1024

class RuleStatus(str, Enum):
    PRESERVED = "PRESERVED"
    ALLOWED_CHANGE = "ALLOWED_CHANGE"
    MATERIAL_CHANGE = "MATERIAL_CHANGE"
    MISSING = "MISSING"
    BROKEN = "BROKEN"
    CONFLICTING = "CONFLICTING"
    UNREADABLE = "UNREADABLE"

class Aggregate(str, Enum):
    READY = "READY"
    BLOCKED = "BLOCKED"
    INCONCLUSIVE = "INCONCLUSIVE"

BLOCKING = {RuleStatus.MATERIAL_CHANGE, RuleStatus.MISSING, RuleStatus.BROKEN}
UNCERTAIN = {RuleStatus.CONFLICTING, RuleStatus.UNREADABLE}
PASSING = {RuleStatus.PRESERVED, RuleStatus.ALLOWED_CHANGE}

def canonical_json(value: object) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def snapshot_digest(snapshot: dict) -> str:
    return sha256(canonical_json(snapshot).encode()).hexdigest()

def validate_snapshot(snapshot: dict, expected_route_id: str, expected_source_url: str) -> None:
    required={"schema_version","route_id","source_url","captured_at","title","canonical_url","headings","visible_text","important_links","forms","claims"}
    if set(snapshot)!=required: raise ValueError("snapshot fields do not match schema")
    if snapshot["schema_version"]!="cutover.baseline.v1": raise ValueError("unsupported snapshot schema")
    if snapshot["route_id"]!=expected_route_id: raise ValueError("snapshot route mismatch")
    if snapshot["source_url"]!=expected_source_url: raise ValueError("snapshot source mismatch")
    if not snapshot["source_url"].startswith(("https://","http://")): raise ValueError("snapshot source must be http(s)")
    if not isinstance(snapshot["captured_at"],str) or len(snapshot["captured_at"])>80: raise ValueError("capture timestamp invalid")
    if not isinstance(snapshot["title"],str) or len(snapshot["title"])>240: raise ValueError("title invalid")
    if not isinstance(snapshot["canonical_url"],str) or len(snapshot["canonical_url"])>MAX_URL: raise ValueError("canonical url invalid")
    if not isinstance(snapshot["visible_text"],str) or len(snapshot["visible_text"])>MAX_TEXT: raise ValueError("visible text too long")
    bounds={"headings":(MAX_HEADINGS,240),"important_links":(MAX_LINKS,MAX_URL),"forms":(MAX_FORMS,600),"claims":(MAX_CLAIMS,600)}
    for key,(max_items,max_len) in bounds.items():
        value=snapshot[key]
        if not isinstance(value,list) or len(value)>max_items or not all(isinstance(x,str) and len(x)<=max_len for x in value):
            raise ValueError(f"{key} invalid")

def derive_route(statuses: Iterable[str], evidence_available: bool=True, source_match: bool=True) -> Aggregate:
    values=[RuleStatus(s) for s in statuses]
    if any(v in BLOCKING for v in values): return Aggregate.BLOCKED
    if not evidence_available or not source_match or any(v in UNCERTAIN for v in values): return Aggregate.INCONCLUSIVE
    if values and all(v in PASSING for v in values): return Aggregate.READY
    return Aggregate.INCONCLUSIVE

def derive_candidate(route_results: Iterable[str], required_count: int, assessed_count: int) -> Aggregate:
    values=[Aggregate(v) for v in route_results]
    if any(v is Aggregate.BLOCKED for v in values): return Aggregate.BLOCKED
    if assessed_count!=required_count or required_count==0: return Aggregate.INCONCLUSIVE
    if any(v is Aggregate.INCONCLUSIVE for v in values): return Aggregate.INCONCLUSIVE
    return Aggregate.READY if all(v is Aggregate.READY for v in values) else Aggregate.INCONCLUSIVE

def authorization_allowed(*,aggregate:str,review_deadline:int,now:int,challenge_open:bool,assessed_generation:int,current_generation:int,candidate_ref:str,authorized_ref:str|None=None)->bool:
    return (Aggregate(aggregate) is Aggregate.READY and now>=review_deadline and not challenge_open and assessed_generation==current_generation and bool(candidate_ref) and (authorized_ref is None or authorized_ref==candidate_ref))

def challenge_allowed(*,state:str,now:int,review_deadline:int,challenge_open:bool,challenge_used_generation:int,current_generation:int)->bool:
    return state=="READY" and now<review_deadline and not challenge_open and challenge_used_generation!=current_generation

def defuse_untrusted_text(text:str,limit:int=MAX_TEXT)->str:
    text=text[:limit]
    return text.replace("</CUTOVER_DATA>","<"+"\\/"+"CUTOVER_DATA>").replace("```","` ` `")
