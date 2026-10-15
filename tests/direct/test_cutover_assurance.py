import json
import hashlib
import pytest

CONTRACT="contracts/cutover.py"
BASE_ORIGIN="https://fixture.local"
CANDIDATE_ORIGIN="https://candidate.local"
MANIFEST_URL=CANDIDATE_ORIGIN+"/.well-known/cutover.json"
CANDIDATE_BODY="<html><head><title>Pricing</title><link rel='canonical' href='https://candidate.local/pricing'></head><body><h1>Plans</h1><p>Pro $49 per month. Cancel with 30 days notice.</p><form action='/signup' method='post'><input name='email'></form></body></html>"
BASELINE_BODY="<html><head><title>Pricing</title><link rel='canonical' href='https://fixture.local/pricing'></head><body><h1>Plans</h1><p>Pro $49 per month. Cancel with 30 days notice.</p><form action='/signup' method='post'></form></body></html>"


def _canon(value): return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
def _digest(value): return hashlib.sha256(_canon(value).encode()).hexdigest()
def _body_digest(value): return hashlib.sha256(value.encode()).hexdigest()
def _rules(): return json.dumps([{"id":"pricing","question":"Is the $49 monthly commitment preserved?","allowed_changes":"Cosmetic copy/layout changes only."},{"id":"cancel","question":"Is the 30 day cancellation obligation preserved?","allowed_changes":"Equivalent wording is allowed."}])
def _snapshot(): return {"schema_version":"cutover.baseline.v1","route_id":"pricing","source_url":BASE_ORIGIN+"/pricing","captured_at":"2026-09-29T00:00:00Z","title":"Pricing","canonical_url":BASE_ORIGIN+"/pricing","headings":["Plans"],"visible_text":"Pro $49 per month. Cancel with 30 days notice.","important_links":[],"forms":["POST /signup"],"claims":["$49/month","30 days notice"]}
def _manifest(ref="release-a", body=CANDIDATE_BODY): return {"schema_version":"cutover.candidate.v1","candidate_origin":CANDIDATE_ORIGIN,"release_ref":ref,"routes":[{"route_id":"pricing","path":"/pricing","content_sha256":_body_digest(body)}]}
def _mock_baseline(vm, snapshot):
    vm.mock_web(r".*fixture\.local/pricing.*", {"status":200,"body":BASELINE_BODY})
    vm.mock_web(r".*proof\.local/baseline-pricing\.json.*", {"status":200,"body":json.dumps(snapshot)})
    vm.mock_llm(r".*Authenticate a CUTOVER baseline snapshot.*", json.dumps({"faithful":True,"reason":"snapshot comparison"}))
def _baseline(vm, contract, review=300):
    migration_id=contract.create_migration("Pricing migration",BASE_ORIGIN,review); contract.add_route(migration_id,"pricing",BASE_ORIGIN+"/pricing","/pricing",_rules()); snapshot=_snapshot(); _mock_baseline(vm,snapshot)
    contract.freeze_route(migration_id,"pricing","https://proof.local/baseline-pricing.json",json.dumps(snapshot),_digest(snapshot)); contract.seal_baseline(migration_id); return migration_id
def _mock_manifest(vm, manifest): vm.mock_web(r".*candidate\.local/\.well-known/cutover\.json.*", {"status":200,"body":json.dumps(manifest)})
def _ready(vm, contract, migration_id):
    manifest=_manifest(); _mock_manifest(vm,manifest); assert contract.set_candidate(migration_id,CANDIDATE_ORIGIN,MANIFEST_URL,_digest(manifest))>=1
    vm.mock_web(r".*candidate\.local/pricing.*", {"status":200,"body":CANDIDATE_BODY})
    vm.mock_llm(r".*CUTOVER semantic comparison stage.*", json.dumps({"findings":[{"rule_id":"pricing","status":"PRESERVED","reason":"pricing preserved"},{"rule_id":"cancel","status":"PRESERVED","reason":"cancel preserved"}]}))
    assert contract.assess_route(migration_id,"pricing")=="READY"; contract.derive_candidate(migration_id); return manifest


def _mock_assurance(vm, manifest, statuses=("PRESERVED", "PRESERVED"), body=CANDIDATE_BODY, status=200):
    _mock_manifest(vm, manifest)
    vm.mock_web(r".*candidate\.local/pricing.*", {"status": status, "body": body})
    if status != 200:
        return
    findings = []
    for rule_id, finding_status in zip(("pricing", "cancel"), statuses):
        findings.append({"rule_id": rule_id, "status": finding_status, "reason": "assurance finding"})
    vm.mock_llm(r".*CUTOVER post-authorization assurance.*", json.dumps({"findings": findings}))


def _authorized(direct_vm, direct_deploy):
    direct_vm.warp("2026-09-29T12:00:00Z")
    contract = direct_deploy(CONTRACT)
    migration_id = _baseline(direct_vm, contract, review=300)
    manifest = _ready(direct_vm, contract, migration_id)
    direct_vm.warp("2026-09-29T12:10:00Z")
    assert contract.authorize(migration_id)
    return contract, migration_id, manifest, direct_vm.sender


def test_assurance_verified_lifecycle_and_terminal_replay(direct_vm, direct_deploy):
    contract, migration_id, manifest, _ = _authorized(direct_vm, direct_deploy)
    assert contract.begin_assurance(migration_id, 60) == "OBSERVING"
    direct_vm.clear_mocks()
    _mock_assurance(direct_vm, manifest)
    assert contract.submit_assurance_checkpoint(migration_id, "pricing", 1, CANDIDATE_ORIGIN + "/pricing") == "VERIFIED"
    with direct_vm.expect_revert("checkpoint version invalid"):
        contract.submit_assurance_checkpoint(migration_id, "pricing", 1, CANDIDATE_ORIGIN + "/pricing")
    direct_vm.warp("2026-09-29T12:11:01Z")
    assert contract.finalize_assurance(migration_id) == "VERIFIED"
    with direct_vm.expect_revert("assurance is terminal"):
        contract.finalize_assurance(migration_id)
    assurance = contract.get_assurance(migration_id)
    assert assurance["status"] == "VERIFIED"
    assert assurance["authorization_digest"] == contract.get_authorization(migration_id)["authorization_digest"]


def test_assurance_semantic_material_deviation(direct_vm, direct_deploy):
    contract, migration_id, manifest, _ = _authorized(direct_vm, direct_deploy)
    contract.begin_assurance(migration_id, 60)
    direct_vm.clear_mocks()
    _mock_assurance(direct_vm, manifest, statuses=("MATERIAL_CHANGE", "PRESERVED"))
    assert contract.submit_assurance_checkpoint(migration_id, "pricing", 1, CANDIDATE_ORIGIN + "/pricing") == "DEVIATED"
    direct_vm.warp("2026-09-29T12:11:01Z")
    assert contract.finalize_assurance(migration_id) == "DEVIATED"


def test_assurance_unavailable_is_inconclusive_and_owner_bound(direct_vm, direct_deploy, direct_bob):
    contract, migration_id, manifest, owner = _authorized(direct_vm, direct_deploy)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("not migration owner"):
        contract.begin_assurance(migration_id, 60)
    direct_vm.sender = owner
    contract.begin_assurance(migration_id, 60)
    direct_vm.clear_mocks()
    _mock_assurance(direct_vm, manifest, status=503)
    assert contract.submit_assurance_checkpoint(migration_id, "pricing", 1, CANDIDATE_ORIGIN + "/pricing") == "INCONCLUSIVE"
    direct_vm.warp("2026-09-29T12:11:01Z")
    assert contract.finalize_assurance(migration_id) == "INCONCLUSIVE"


@pytest.mark.parametrize("window", [0, 59, 86401])
def test_assurance_window_bounds(direct_vm, direct_deploy, window):
    contract, migration_id, _, _ = _authorized(direct_vm, direct_deploy)
    with direct_vm.expect_revert("assurance window out of bounds"):
        contract.begin_assurance(migration_id, window)
