import fs from "node:fs";
const files=["apps/web/lib/config.ts","packages/gate/src/index.ts",".env.example"];
for(const f of files){const s=fs.readFileSync(f,"utf8"); if(s.includes("61997")||s.includes("studioDevnet")||s.includes("studio-dev")) throw new Error("Forbidden RC network in "+f)}
if(!fs.readFileSync("apps/web/lib/config.ts","utf8").includes("61999")) throw new Error("Studionet chain missing");
console.log("Network discipline OK: studionet / 61999");
