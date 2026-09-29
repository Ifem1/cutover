import fs from "node:fs";
const p=fs.readFileSync(new URL("../../apps/web/lib/policy.ts",import.meta.url),"utf8");
const t=fs.readFileSync(new URL("../../apps/web/tests/policy.test.ts",import.meta.url),"utf8");
const guards={
  challenge:["!x.challengeOpen","challengeOpen:true"],
  generation:["x.assessedGeneration===x.candidateGeneration","assessedGeneration:1"],
  network:["&&x.networkOk","networkOk:false"],
  readyNotAuthorized:["!x.authorized","base.authorized"]
};
const bad=[];
for(const [name,[g,test]] of Object.entries(guards)){if(!p.includes(g)||!t.includes(test))bad.push(name)}
if(bad.length){console.error("Mutation guard coverage missing:",bad.join(", "));process.exit(1)}
console.log("Frontend mutation guard sweep:",Object.keys(guards).length+"/"+Object.keys(guards).length);
