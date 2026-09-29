"""Actual-contract mutation harness for CUTOVER.

Every mutant edits contracts/cutover.py itself, compiles the mutant, and runs the
Direct Mode test(s) that exercise the changed invariant. A complete unmodified
Direct Mode control run is mandatory before any mutant is executed.
"""
from __future__ import annotations
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
SOURCE_PATH=ROOT/"contracts/cutover.py"
TEST_FILE="tests/direct/test_cutover_direct.py"
SOURCE=SOURCE_PATH.read_text()

# (name, source text, mutant text, targeted Direct Mode test function)
MUTANTS=[
    ("route_cap_plus_one","MAX_ROUTES=24","MAX_ROUTES=25","test_rule_cap_and_route_cap"),
    ("rule_cap_plus_one","MAX_RULES=12","MAX_RULES=13","test_rule_cap_and_route_cap"),
    ("ordinary_retry_cap_plus_one","MAX_ORDINARY_ATTEMPTS=3","MAX_ORDINARY_ATTEMPTS=4","test_inconclusive_retries_are_counted_and_preserved"),
    ("allow_empty_title",'_bounded(title,120,"title",False)','_bounded(title,120,"title",True)',"test_title_empty_rejected"),
    ("review_lower_bound_off_by_one","int(review_window_seconds)<300","int(review_window_seconds)<299","test_review_window_bounds"),
    ("review_upper_bound_off_by_one","int(review_window_seconds)>604800","int(review_window_seconds)>604801","test_review_window_bounds"),
    ("invert_owner_guard",'str(gl.message.sender_address).lower()!=m["owner"].lower()','str(gl.message.sender_address).lower()==m["owner"].lower()',"test_owner_and_duplicate_route_guards"),
    ("allow_baseline_cross_origin",'if not _same_origin(m["baseline_origin"],baseline_url):','if False and not _same_origin(m["baseline_origin"],baseline_url):',"test_baseline_route_must_stay_in_origin"),
    ("allow_candidate_absolute_mapping",'if not _safe_path(candidate_path):','if False and not _safe_path(candidate_path):',"test_candidate_path_constraints"),
    ("allow_duplicate_route",'if route_id in m["route_ids"]:','if False and route_id in m["route_ids"]:',"test_owner_and_duplicate_route_guards"),
    ("allow_zero_rules",'not (1<=len(rules)<=MAX_RULES)','not (0<=len(rules)<=MAX_RULES)',"test_empty_rule_list_rejected"),
    ("allow_malformed_rule_schema",'or set(r)!={"id","question","allowed_changes"}','or False',"test_malformed_rule_fields_rejected"),
    ("allow_duplicate_rule_id",'if r["id"] in rule_ids:','if False and r["id"] in rule_ids:',"test_malformed_rules_and_duplicate_rule_ids"),
    ("skip_snapshot_schema",'if not _valid_snapshot(snap):','if False and not _valid_snapshot(snap):',"test_snapshot_schema_and_identity_constraints"),
    ("skip_snapshot_identity",'if snap.get("route_id")!=route_id or snap.get("source_url")!=r["baseline_url"]:','if False and (snap.get("route_id")!=route_id or snap.get("source_url")!=r["baseline_url"]):',"test_snapshot_schema_and_identity_constraints"),
    ("skip_snapshot_digest",'if not _valid_sha(expected_sha256) or digest!=expected_sha256:','if False:',"test_snapshot_digest_mismatch_fails_before_consensus"),
    ("allow_non_http_snapshot_pointer",'if not snapshot_url.startswith(("https://","http://")):','if False and not snapshot_url.startswith(("https://","http://")):',"test_snapshot_url_scheme_rejected"),
    ("ignore_snapshot_artifact_status",'if int(artifact.status)!=200 or len(artifact_body)>MAX_MANIFEST_BYTES:','if False or len(artifact_body)>MAX_MANIFEST_BYTES:',"test_snapshot_artifact_unavailable_fails_closed"),
    ("ignore_snapshot_artifact_digest",'if _digest(artifact_json)!=digest:','if False and _digest(artifact_json)!=digest:',"test_snapshot_artifact_content_is_authenticated"),
    ("ignore_baseline_source_failure",'if not probe.get("available"): return {"ok":False,"code":"SOURCE_UNAVAILABLE"','if False and not probe.get("available"): return {"ok":False,"code":"SOURCE_UNAVAILABLE"',"test_baseline_source_unavailable_fails_closed"),
    ("accept_unfaithful_baseline",'"ok":out["faithful"] is True','"ok":True',"test_baseline_unfaithful_consensus_rejected"),
    ("ignore_baseline_probe_validator_binding",'and p.get("probe_digest")==v.get("probe_digest")','and True',"test_baseline_validator_probe_disagreement_detected"),
    ("allow_candidate_from_terminal",'if m["state"] not in ("BASELINED","CANDIDATE","BLOCKED","INCONCLUSIVE","READY","CHALLENGED"):','if False and m["state"] not in ("BASELINED","CANDIDATE","BLOCKED","INCONCLUSIVE","READY","CHALLENGED"):',"test_authorized_state_is_terminal"),
    ("allow_invalid_candidate_origin",'origin=candidate_origin.rstrip("/"); _bounded(candidate_origin,1024,"candidate origin",False); _bounded(manifest_url,1024,"manifest url",False)\n        if not _valid_origin(origin):','origin=candidate_origin.rstrip("/"); _bounded(candidate_origin,1024,"candidate origin",False); _bounded(manifest_url,1024,"manifest url",False)\n        if False and not _valid_origin(origin):',"test_invalid_candidate_origin_rejected"),
    ("allow_external_manifest_url",'if manifest_url!=origin+"/.well-known/cutover.json":','if False and manifest_url!=origin+"/.well-known/cutover.json":',"test_manifest_url_must_be_well_known_same_origin"),
    ("ignore_manifest_http_status",'if int(response.status)!=200 or len(body)>MAX_MANIFEST_BYTES:','if False or len(body)>MAX_MANIFEST_BYTES:',"test_manifest_unavailable_rejected"),
    ("ignore_manifest_schema_version",'or manifest.get("schema_version")!="cutover.candidate.v1"','or False',"test_manifest_schema_version_rejected"),
    ("ignore_manifest_origin",'manifest.get("candidate_origin")!=origin or ','',"test_manifest_origin_mismatch_rejected"),
    ("allow_empty_manifest_release_ref",' or not manifest.get("release_ref")','',"test_manifest_empty_release_ref_rejected"),
    ("ignore_manifest_route_schema",' or set(item)!=MANIFEST_ROUTE_FIELDS',' or False',"test_manifest_route_schema_extra_field_rejected"),
    ("ignore_manifest_route_digest_shape",' or not _valid_sha(digest)',' or False',"test_manifest_invalid_route_content_digest_rejected"),
    ("ignore_manifest_route_mapping",'if routes_by_id[rid].get("candidate_path")!=path:','if False and routes_by_id[rid].get("candidate_path")!=path:',"test_manifest_route_mapping_mismatch_rejected"),
    ("ignore_manifest_expected_digest",'if digest!=expected_manifest_sha256:','if False and digest!=expected_manifest_sha256:',"test_manifest_digest_mismatch_rejected"),
    ("replace_verified_release_ref",'m["candidate_ref"]=result["release_ref"]','m["candidate_ref"]="mutated-ref"',"test_candidate_manifest_binds_ref_and_generation"),
    ("do_not_increment_generation",'m["candidate_generation"]+=1','m["candidate_generation"]+=0',"test_candidate_manifest_binds_ref_and_generation"),
    ("drop_manifest_digest_binding",'m["candidate_manifest_digest"]=result["digest"]','m["candidate_manifest_digest"]=""',"test_candidate_manifest_binds_ref_and_generation"),
    ("leave_open_challenge_unresolved_on_new_candidate",'old_challenge["resolved"]=True; old_challenge["resolved_at"]=_now(); old_challenge["route_result"]="SUPERSEDED_BY_NEW_CANDIDATE"; self.challenges[old_key]=_dumps(old_challenge)','old_challenge["route_result"]="SUPERSEDED_BY_NEW_CANDIDATE"; self.challenges[old_key]=_dumps(old_challenge)',"test_new_candidate_supersedes_open_challenge_record"),
    ("force_manifest_match",'manifest_match=(live_manifest_digest==m["candidate_manifest_digest"] and isinstance(live_manifest,dict) and live_manifest.get("release_ref")==m["candidate_ref"] and live_manifest.get("candidate_origin")==m["candidate_origin"])','manifest_match=True',"test_candidate_manifest_mutation_after_registration_is_inconclusive"),
    ("force_content_match",'content_match=bool(probe.get("available") and _valid_sha(expected_body) and probe.get("body_sha256")==expected_body)','content_match=True',"test_candidate_content_digest_mismatch_is_inconclusive"),
    ("force_source_match",'source_match=bool(probe.get("available") and (not canonical or _safe_path(canonical) or _same_origin(m["candidate_origin"],canonical)))','source_match=True',"test_candidate_canonical_cross_origin_is_inconclusive"),
    ("ignore_blocking_findings",'if any(s in BLOCKING for s in statuses): return "BLOCKED"','if False and any(s in BLOCKING for s in statuses): return "BLOCKED"',"test_definite_failure_blocks_candidate"),
    ("treat_uncertain_as_passing",'if (not evidence_available) or (not source_match) or (not manifest_match) or (not content_match) or any(s in UNCERTAIN for s in statuses): return "INCONCLUSIVE"\n        if statuses and all(s in PASSING for s in statuses): return "READY"','if (not evidence_available) or (not source_match) or (not manifest_match) or (not content_match): return "INCONCLUSIVE"\n        if statuses and all(s in PASSING+UNCERTAIN for s in statuses): return "READY"',"test_uncertain_finding_is_inconclusive"),
    ("allow_decisive_reassessment",'if current.get("route_result") in ("READY","BLOCKED"):','if False and current.get("route_result") in ("READY","BLOCKED"):',"test_ready_assessment_is_locked_from_ordinary_resampling"),
    ("allow_fourth_ordinary_retry",'if kind=="ORDINARY" and count>=MAX_ORDINARY_ATTEMPTS:','if kind=="ORDINARY" and count>MAX_ORDINARY_ATTEMPTS:',"test_inconclusive_retries_are_counted_and_preserved"),
    ("drop_attempt_history",'self.assessment_attempts[_attempt_key(str(migration_id),gen,route_id,attempt)]=_dumps(result)','pass # mutant drops immutable attempt history',"test_inconclusive_retries_are_counted_and_preserved"),
    ("do_not_advance_attempt_count",'self.attempt_counts[_assessment_key(str(migration_id),gen,route_id)]=str(attempt)','self.attempt_counts[_assessment_key(str(migration_id),gen,route_id)]=str(count)',"test_inconclusive_retries_are_counted_and_preserved"),
    ("ignore_validator_finding_signature",'and _finding_signature(p.get("findings",[]))==_finding_signature(v.get("findings",[])))','and True)',"test_validator_status_disagreement_is_detected"),
    ("ignore_blocked_aggregate_precedence",'if "BLOCKED" in results: agg="BLOCKED"','if False and "BLOCKED" in results: agg="BLOCKED"',"test_multi_route_aggregation_precedence"),
    ("never_ready_aggregate",'elif all(x=="READY" for x in results): agg="READY"','elif all(x=="READY" for x in results): agg="INCONCLUSIVE"',"test_ready_assessment_uses_bound_manifest_and_probe"),
    ("reset_review_window_on_rederive",'if m["state"]!="READY" or m["ready_at"]==0:\n                now=_now(); m["ready_at"]=now; m["review_deadline"]=now+m["review_window_seconds"]','if True:\n                now=_now(); m["ready_at"]=now; m["review_deadline"]=now+m["review_window_seconds"]',"test_repeated_ready_derivation_does_not_extend_review_window"),
    ("allow_owner_self_challenge",'if str(gl.message.sender_address).lower()==m["owner"].lower():','if False and str(gl.message.sender_address).lower()==m["owner"].lower():',"test_owner_cannot_self_challenge"),
    ("allow_late_challenge",'if _now()>=m["review_deadline"]:','if False and _now()>=m["review_deadline"]:',"test_challenge_after_review_deadline_rejected"),
    ("allow_repeat_route_challenge",'if self.challenge_route_used.get(_challenge_route_key(str(migration_id),gen,route_id)):','if False and self.challenge_route_used.get(_challenge_route_key(str(migration_id),gen,route_id)):',"test_repeat_challenge_same_route_rejected"),
    ("accept_unverified_challenge_evidence",'if not verified.get("ok"):','if False and not verified.get("ok"):',"test_irrelevant_first_challenger_does_not_burn_slot"),
    ("ignore_challenge_evidence_digest_disagreement",'and p.get("evidence_digest")==v.get("evidence_digest")','and True',"test_challenge_validator_digest_disagreement_detected"),
    ("allow_authorize_before_ready",'if m["state"]!="READY" or m["aggregate"]!="READY":','if False:',"test_authorize_before_ready_rejected"),
    ("require_extra_second_after_deadline",'if _now()<m["review_deadline"]:','if _now()<=m["review_deadline"]:',"test_authorization_uses_time_and_evidence_root"),
    ("weaken_authorization_evidence_root",'evidence_root=_digest(evidence_set)','evidence_root=_digest({"routes":route_evidence})',"test_authorization_evidence_root_is_deterministic"),
    ("allow_terminal_cancel",'if m["state"] in ("AUTHORIZED","CANCELLED"):','if False and m["state"] in ("AUTHORIZED","CANCELLED"):',"test_authorized_state_is_terminal"),
    ("disable_event_ring",'slot=index%MAX_EVENTS','slot=index',"test_event_ring_reads_latest_indices"),
    ("ignore_event_retention_floor",'oldest=max(0,total-MAX_EVENTS)','oldest=0',"test_event_ring_preserves_recent_auditability"),
    ("do_not_increment_owner_index_count",'self.owner_migration_counts[key]=str(count+1)','self.owner_migration_counts[key]=str(count)',"test_migrations_of_is_paginated"),
    ("break_attempt_pagination_start",'count=self._attempt_count(migration_id,generation,route_id); start=max(int(offset),0); limit=min(max(int(limit),0),MAX_PAGE); out=[]\n        for i in range(start+1,min(count+1,start+limit+1)):','count=self._attempt_count(migration_id,generation,route_id); start=max(int(offset),0); limit=min(max(int(limit),0),MAX_PAGE); out=[]\n        for i in range(start,min(count+1,start+limit)):',"test_attempt_history_pagination"),
]


def run_pytest(contract_path:Path,node:str|None=None,quiet:bool=True)->subprocess.CompletedProcess:
    env=os.environ.copy(); env["CUTOVER_CONTRACT_PATH"]=str(contract_path)
    cmd=[sys.executable,"-m","pytest",TEST_FILE]
    if node: cmd[-1]=f"{TEST_FILE}::{node}"
    cmd += ["-q"] if quiet else ["-v"]
    return subprocess.run(cmd,cwd=ROOT,env=env,text=True,capture_output=quiet)


def main()->int:
    control=run_pytest(SOURCE_PATH,quiet=False)
    if control.returncode!=0:
        print("UNMODIFIED CONTROL FAILED",file=sys.stderr); return 2
    print("UNMODIFIED CONTROL PASS")
    killed=[]; failures=[]
    with tempfile.TemporaryDirectory(prefix="cutover-mutants-") as td:
        td=Path(td)
        for index,(name,old,new,test_name) in enumerate(MUTANTS,1):
            occurrences=SOURCE.count(old)
            if occurrences!=1:
                failures.append(f"{name}: pattern count {occurrences}, expected 1"); continue
            mutant=SOURCE.replace(old,new,1)
            path=td/f"cutover_{index:02d}_{name}.py"; path.write_text(mutant)
            compile_result=subprocess.run([sys.executable,"-m","py_compile",str(path)],cwd=ROOT,capture_output=True,text=True)
            if compile_result.returncode!=0:
                failures.append(f"{name}: invalid mutant syntax: {compile_result.stderr.strip()}"); continue
            result=run_pytest(path,test_name)
            if result.returncode==0:
                failures.append(f"{name}: SURVIVED {test_name}")
            else:
                killed.append(name); print(f"KILLED {index:02d}/{len(MUTANTS)} {name} -> {test_name}")
    if failures:
        print("\n".join(failures),file=sys.stderr); print(f"Killed {len(killed)}/{len(MUTANTS)} actual-contract mutants",file=sys.stderr); return 1
    print(f"Killed {len(killed)}/{len(MUTANTS)} meaningful actual-contract mutants")
    return 0

if __name__=="__main__": raise SystemExit(main())
