import fs from "node:fs";import {spawnSync} from "node:child_process";import {fileURLToPath} from "node:url";import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const files={policy:path.join(root,"apps/web/lib/policy.ts"),workflow:path.join(root,"apps/web/lib/workflow.ts")};
const original=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p,"utf8")]));
const mutants=[
 ["policy","seal_without_routes","x.routeCount>0&&x.allRoutesFrozen","true&&x.allRoutesFrozen"],
 ["policy","seal_unfrozen","x.routeCount>0&&x.allRoutesFrozen","x.routeCount>0&&true"],
 ["policy","owner_can_challenge","challenge:!x.isOwner&&","challenge:true&&"],
 ["policy","challenge_after_deadline","&&x.now<x.reviewDeadline&&x.networkOk","&&true&&x.networkOk"],
 ["policy","challenge_cap_ignored","&&x.challengeCount<3&&","&&true&&"],
 ["policy","challenge_wrong_network","&&x.networkOk,\n  reassess","&&true,\n  reassess"],
 ["policy","authorize_open_challenge","authorize:x.state===\"READY\"&&!x.challengeOpen","authorize:x.state===\"READY\"&&true"],
 ["policy","authorize_stale_generation","&&x.assessedGeneration===x.candidateGeneration","&&true"],
 ["policy","authorize_before_deadline","&&x.now>=x.reviewDeadline","&&true"],
 ["policy","authorize_wrong_network","&&!x.authorized&&x.networkOk","&&!x.authorized&&true"],
 ["policy","non_owner_candidate","setCandidate:x.isOwner&&","setCandidate:true&&"],
 ["policy","non_owner_cancel","cancel:x.isOwner","cancel:true"],
 ["workflow","allow_absolute_candidate","/^\\/(?!\\/)/.test(path)","true"],
 ["workflow","allow_parent_segments","&& !path.includes('..')","&& true"],
 ["workflow","allow_query_fragment","&& !/[?#]/.test(path)","&& true"],
 ["workflow","retry_ready","if(currentResult==='READY'||currentResult==='BLOCKED')return false;","if(currentResult==='BLOCKED')return false;"],
 ["workflow","retry_blocked","if(currentResult==='READY'||currentResult==='BLOCKED')return false;","if(currentResult==='READY')return false;"],
 ["workflow","fourth_retry","return attemptCount<MAX_ORDINARY_ATTEMPTS;","return attemptCount<=MAX_ORDINARY_ATTEMPTS;"],
 ["workflow","progress_unclamped","return Math.min(1,Math.max(0,(now-readyAt)/(deadline-readyAt)));","return (now-readyAt)/(deadline-readyAt);"],
];
function test(){return spawnSync("npm",["-w","@cutover/web","run","test","--","tests/policy.test.ts","tests/workflow.test.ts"],{cwd:root,stdio:"ignore",shell:process.platform==="win32"}).status;}
if(test()!==0){console.error("UNMODIFIED FRONTEND CONTROL FAILED");process.exit(2)}console.log("UNMODIFIED FRONTEND CONTROL PASS");
const bad=[];try{for(const [file,name,from,to] of mutants){const src=original[file];if(src.split(from).length!==2){bad.push(`${name}:pattern-missing-or-ambiguous`);continue}fs.writeFileSync(files[file],src.replace(from,to));if(test()===0)bad.push(`${name}:survived`);fs.writeFileSync(files[file],src);}}finally{for(const [k,p] of Object.entries(files))fs.writeFileSync(p,original[k])}
if(bad.length){console.error(bad.join("\n"));process.exit(1)}console.log(`Killed ${mutants.length}/${mutants.length} frontend workflow mutants`);
