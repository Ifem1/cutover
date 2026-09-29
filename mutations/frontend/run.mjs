import fs from "node:fs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const policyPath=path.join(root,"apps/web/lib/policy.ts");
const original=fs.readFileSync(policyPath,"utf8");
const mutants={
  authorize_while_challenged:["authorize:x.state===\"READY\"&&!x.challengeOpen","authorize:x.state===\"READY\"&&true"],
  ready_means_authorized:["authorize:x.state===\"READY\"&&!x.challengeOpen&&x.assessedGeneration===x.candidateGeneration&&x.now>=x.reviewDeadline&&!x.authorized&&x.networkOk","authorize:true"],
  ignore_candidate_generation:["&&x.assessedGeneration===x.candidateGeneration","&&true"],
  authorize_before_deadline:["&&x.now>=x.reviewDeadline","&&true"],
  allow_wrong_network:["&&!x.authorized&&x.networkOk","&&!x.authorized&&true"],
  challenge_after_deadline:["&&x.now<x.reviewDeadline&&x.networkOk","&&true&&x.networkOk"],
  allow_second_challenge:["&&x.challengeUsedGeneration!==x.candidateGeneration","&&true"],
  non_owner_cancel:["cancel:x.isOwner","cancel:true"],
};
const bad=[];
try{
  for(const [name,[from,to]] of Object.entries(mutants)){
    if(!original.includes(from)){bad.push(name+":pattern-missing");continue}
    fs.writeFileSync(policyPath,original.replace(from,to));
    const p=spawnSync("npm",["-w","@cutover/web","run","test","--","tests/policy.test.ts"],{cwd:root,stdio:"ignore",shell:process.platform==="win32"});
    if(p.status===0) bad.push(name+":survived");
    fs.writeFileSync(policyPath,original);
  }
}finally{fs.writeFileSync(policyPath,original)}
if(bad.length){console.error(bad.join("\n"));process.exit(1)}
console.log(`Killed ${Object.keys(mutants).length}/${Object.keys(mutants).length} frontend policy mutants`);
