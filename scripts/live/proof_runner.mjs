#!/usr/bin/env node
/**
 * CUTOVER live-proof executor. It performs no action unless --execute is given.
 * Wallet/account configuration is intentionally external to the repository and
 * must already be configured for the pinned GenLayer CLI.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";

const args=process.argv.slice(2);const execute=args.includes("--execute");const planArg=args.find(x=>x.endsWith(".json"));
if(!planArg)throw new Error("Usage: node scripts/live/proof_runner.mjs proof/live-plan.json [--execute]");
const plan=JSON.parse(fs.readFileSync(planArg,"utf8"));const rpc=plan.rpc||"https://studio.genlayer.com/api";
if(plan.chain_id!==61999)throw new Error(`Plan chain_id must be 61999, got ${plan.chain_id}`);
async function rpcCall(method,params=[]){const res=await fetch(rpc,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method,params,id:1})});if(!res.ok)throw new Error(`RPC HTTP ${res.status}`);const body=await res.json();if(body.error)throw new Error(JSON.stringify(body.error));return body.result;}
const actualChain=Number.parseInt(await rpcCall("eth_chainId"),16);if(actualChain!==61999)throw new Error(`Refusing non-Studionet chain ${actualChain}`);
const sourcePath=path.resolve("contracts/cutover.py");const source=fs.readFileSync(sourcePath);const sourceSha=crypto.createHash("sha256").update(source).digest("hex");
const preview={mode:execute?"EXECUTE":"DRY_RUN",network:{name:"studionet",chain_id:actualChain,rpc},source:{path:"contracts/cutover.py",sha256:sourceSha},planned_steps:(plan.steps||[]).map(x=>({name:x.name,kind:x.kind,method:x.method||null}))};
if(!execute){console.log(JSON.stringify(preview,null,2));process.exit(0);}

const started=new Date().toISOString();const runId=started.replace(/[:.]/g,"-");const outDir=path.resolve("artifacts/live",runId);fs.mkdirSync(outDir,{recursive:true});
const record={schema_version:"cutover.live-proof-run.v1",started_at:started,network:preview.network,source:preview.source,contract_address:plan.contract_address||null,deployment:null,steps:[],completed:false};
function save(){fs.writeFileSync(path.join(outDir,"run.json"),JSON.stringify(record,null,2)+"\n");}
function cli(argv,label){const p=spawnSync("npm",["exec","--","genlayer",...argv],{encoding:"utf8",env:{...process.env,GENLAYER_RPC:rpc}});const item={label,argv:["genlayer",...argv],exit_code:p.status,stdout:p.stdout||"",stderr:p.stderr||""};fs.writeFileSync(path.join(outDir,`${String(record.steps.length+1).padStart(2,"0")}-${label.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.txt`),`${item.stdout}\n${item.stderr}`);if(p.status!==0)throw Object.assign(new Error(`${label} failed`),{item});return item;}
function firstHash(text){return text.match(/0x[a-fA-F0-9]{64}/)?.[0]||null}function firstAddress(text){return text.match(/0x[a-fA-F0-9]{40}/)?.[0]||null}
function receipt(hash,status){return cli(["receipt",hash,"--status",status,"--rpc",rpc],`receipt-${status.toLowerCase()}`)}
function write(address,method,values,name){const argv=["write",address,method,"--rpc",rpc];for(const v of values||[])argv.push("--args",typeof v==="string"?v:JSON.stringify(v));const raw=cli(argv,`write-${name||method}`);const hash=firstHash(raw.stdout+raw.stderr);if(!hash)throw new Error(`Could not parse transaction hash for ${method}; evidence not recorded as successful`);const accepted=receipt(hash,"ACCEPTED");const finalized=receipt(hash,"FINALIZED");return {kind:"write",name:name||method,method,args:values,transaction_hash:hash,accepted:{stdout:accepted.stdout,stderr:accepted.stderr},finalized:{stdout:finalized.stdout,stderr:finalized.stderr}};}

try{
 if(!record.contract_address){const d=cli(["deploy","--contract","contracts/cutover.py","--rpc",rpc],"deploy");const text=d.stdout+d.stderr;const tx=firstHash(text);const address=firstAddress(text.replace(tx||"",""));if(!tx||!address)throw new Error("Deployment output did not expose both transaction hash and contract address; refusing to invent metadata");record.contract_address=address;record.deployment={transaction_hash:tx,address,stdout:d.stdout,stderr:d.stderr,accepted:receipt(tx,"ACCEPTED").stdout,finalized:receipt(tx,"FINALIZED").stdout};save();const verify=spawnSync(process.execPath.replace(/node$/,"python3"),["scripts/live/verify_source.py","--address",address,"--rpc",rpc],{encoding:"utf8"});record.deployment.source_verification={exit_code:verify.status,stdout:verify.stdout,stderr:verify.stderr};if(verify.status!==0)throw new Error("Deployed source did not exactly match contracts/cutover.py");save();}
 for(const step of plan.steps||[]){let evidence;if(step.kind==="write")evidence=write(record.contract_address,step.method,step.args,step.name);else if(step.kind==="call"){const argv=["call",record.contract_address,step.method,"--rpc",rpc];for(const v of step.args||[])argv.push("--args",typeof v==="string"?v:JSON.stringify(v));const r=cli(argv,`call-${step.name||step.method}`);evidence={kind:"call",name:step.name||step.method,method:step.method,args:step.args||[],stdout:r.stdout,stderr:r.stderr};}else throw new Error(`Unknown step kind ${step.kind}`);record.steps.push(evidence);save();}
 record.completed=true;record.completed_at=new Date().toISOString();save();console.log(JSON.stringify({run_directory:outDir,contract_address:record.contract_address,completed:true},null,2));
}catch(error){record.completed=false;record.failed_at=new Date().toISOString();record.error=error instanceof Error?error.message:String(error);if(error?.item)record.steps.push({kind:"failure",...error.item});save();throw error;}
