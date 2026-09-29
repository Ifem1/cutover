import json, hashlib
CONTRACT="contracts/cutover.py"

def _rules():
    return json.dumps([{"id":"pricing","question":"Is the $49 monthly commitment preserved?","allowed_changes":"Cosmetic copy/layout changes only."}])

def _snapshot():
    return {"schema_version":"cutover.baseline.v1","route_id":"pricing","source_url":"https://fixture.local/pricing","captured_at":"2026-09-29T00:00:00Z","title":"Pricing","canonical_url":"https://fixture.local/pricing","headings":["Plans"],"visible_text":"Pro $49 per month. Cancel with 30 days notice.","important_links":[],"forms":["Start trial"],"claims":["$49/month","30 days notice"]}

def _digest(s): return hashlib.sha256(json.dumps(s,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()

def test_create_and_read_migration(direct_deploy):
    c=direct_deploy(CONTRACT); mid=c.create_migration("Docs migration","https://fixture.local",3600)
    m=c.get_migration(mid); assert m["state"]=="DRAFT" and m["candidate_generation"]==0

def test_owner_can_add_route(direct_deploy):
    c=direct_deploy(CONTRACT); mid=c.create_migration("x","https://fixture.local",3600)
    c.add_route(mid,"pricing","https://fixture.local/pricing","/pricing",_rules())
    assert len(c.get_route(mid,"pricing")["rules"])==1

def test_duplicate_route_rejected(direct_vm,direct_deploy):
    c=direct_deploy(CONTRACT); mid=c.create_migration("x","https://fixture.local",3600)
    c.add_route(mid,"pricing","https://fixture.local/pricing","/pricing",_rules())
    with direct_vm.expect_revert("duplicate route"):
        c.add_route(mid,"pricing","https://fixture.local/pricing","/pricing",_rules())

def test_freeze_and_candidate_generation(direct_vm,direct_deploy):
    c=direct_deploy(CONTRACT); mid=c.create_migration("x","https://fixture.local",3600)
    c.add_route(mid,"pricing","https://fixture.local/pricing","/pricing",_rules()); s=_snapshot()
    direct_vm.mock_web(r".*fixture\.local/pricing.*",{"status":200,"body":"Pricing Plans Pro $49 per month. Cancel with 30 days notice."})
    direct_vm.mock_llm(r".*Authenticate a CUTOVER baseline snapshot.*",json.dumps({"faithful":True,"reason":"matches"}))
    c.freeze_route(mid,"pricing","https://fixture.local/s.json",json.dumps(s),_digest(s)); c.seal_baseline(mid)
    assert c.set_candidate(mid,"https://candidate.local","sha-a")==1
    assert c.set_candidate(mid,"https://candidate.local","sha-b")==2
