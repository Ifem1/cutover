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

const args=process.argv.slice(2);const execute=args.includes("--execute");const offlineDryRun=args.includes("--offline-dry-run");const planArg=args.find(x=>x.endsWith(".json"));
if(!planArg)throw new Error("Usage: node scripts/live/proof_runner.mjs proof/live-plan.json [--execute]");
const plan=JSON.parse(fs.readFileSync(planArg,"utf8"));const rpc=plan.rpc||"https://studio.genlayer.com/api";
if(plan.chain_id!==61999)throw new Error(`Plan chain_id must be 61999, got ${plan.chain_id}`);
const cliEntry=path.resolve("node_modules/genlayer/dist/index.js");
if(!fs.existsSync(cliEntry))throw new Error("Repository-local GenLayer CLI is missing; install the pinned lockfile dependencies first");
const versionCheck=spawnSync(process.execPath,[cliEntry,"--version"],{encoding:"utf8"});
const cliVersion=(versionCheck.stdout||"").trim();
if(versionCheck.status!==0||cliVersion!=="0.39.1")throw new Error(`Refusing CLI ${cliVersion||"unknown"}; repository-local GenLayer CLI 0.39.1 is required`);
async function rpcCall(method,params=[]){const res=await fetch(rpc,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method,params,id:1})});if(!res.ok)throw new Error(`RPC HTTP ${res.status}`);const body=await res.json();if(body.error)throw new Error(JSON.stringify(body.error));return body.result;}
if(execute&&offlineDryRun)throw new Error("--offline-dry-run cannot be combined with --execute");
if(offlineDryRun&&rpc!=="https://studio.genlayer.com/api")throw new Error("Offline dry run requires the pinned Studionet RPC");
const actualChain=offlineDryRun?61999:Number.parseInt(await rpcCall("eth_chainId"),16);if(actualChain!==61999)throw new Error(`Refusing non-Studionet chain ${actualChain}`);
const sourcePath=path.resolve("contracts/cutover.py");const source=fs.readFileSync(sourcePath);const sourceSha=crypto.createHash("sha256").update(source).digest("hex");
const preview={mode:execute?"EXECUTE":"DRY_RUN",network:{name:"studionet",chain_id:actualChain,rpc},tooling:{genlayer_cli:cliVersion},source:{path:"contracts/cutover.py",sha256:sourceSha},planned_steps:(plan.steps||[]).map(x=>({name:x.name,kind:x.kind,method:x.method||null}))};
if(!execute){console.log(JSON.stringify(preview,null,2));process.exit(0);}

const started=new Date().toISOString();const runId=started.replace(/[:.]/g,"-");const outDir=path.resolve("artifacts/live",runId);fs.mkdirSync(outDir,{recursive:true});
const record={schema_version:"cutover.live-proof-run.v1",started_at:started,network:preview.network,tooling:preview.tooling,git_commit:plan.git_commit||null,deployer_address:plan.deployer_address||null,source:preview.source,contract_address:plan.contract_address||null,deployment:null,steps:[],completed:false};
function save(){fs.writeFileSync(path.join(outDir,"run.json"),JSON.stringify(record,null,2)+"\n");}
function cli(argv,label,persist=true){let p,retries=0;const receiptCall=label.startsWith("receipt-");do{p=spawnSync(process.execPath,[cliEntry,...argv],{encoding:"utf8",env:{...process.env,GENLAYER_RPC:rpc},windowsHide:true});const message=(p.stdout||"")+"\n"+(p.stderr||"");if(p.status===0||!receiptCall||retries>=3||!/Unexpected token '<'|<!DOCTYPE|fetch failed|ECONNRESET|ETIMEDOUT/i.test(message))break;retries++;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000);}while(true);const item={label,argv:["node",cliEntry,...argv],exit_code:p.status,retry_count:retries,stdout:p.stdout||"",stderr:p.stderr||""};if(persist)fs.writeFileSync(path.join(outDir,`${String(record.steps.length+1).padStart(2,"0")}-${label.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.txt`),`${item.stdout}\n${item.stderr}`);if(p.error)throw Object.assign(new Error(`${label} could not start: ${p.error.message}`),{item});if(p.status!==0)throw Object.assign(new Error(`${label} failed`),{item});return item;}
function labeledValue(text,label,size){const i=text.toLowerCase().indexOf(label.toLowerCase());if(i<0)return null;return text.slice(i+label.length,i+label.length+240).match(new RegExp(`0x[a-fA-F0-9]{${size}}`))?.[0]||null}
function receiptSummary(raw,requested){const text=(raw.stdout||"")+"\n"+(raw.stderr||"");const field=name=>text.match(new RegExp(`${name}:\\s*['\"]([^'\"]+)['\"]`))?.[1]||null;const executions=[...text.matchAll(/execution_result:\s*['"]([^'"]+)['"]/g)].map(x=>x[1]);const voteBlock=text.match(/validator_votes_name:\s*\[([^\]]*)\]/)?.[1]||"";const votes=[...voteBlock.matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]);return {requested_status:requested,observed_status:field("status_name"),consensus_result:field("result_name"),leader_execution_result:executions[0]||null,reported_execution_results:executions,validator_votes:votes};}
function receipt(hash,status){if(status.toUpperCase()!=="FINALIZED")return cli(["receipt",hash,"--status",status,"--rpc",rpc],`receipt-${status.toLowerCase()}`);for(let poll=0;poll<100;poll++){const raw=cli(["receipt",hash,"--status","ACCEPTED","--rpc",rpc],"receipt-finalized-poll",false);const state=receiptSummary(raw,"FINALIZED");if(state.observed_status&&state.observed_status!=="ACCEPTED"){fs.writeFileSync(path.join(outDir,`${String(record.steps.length+1).padStart(2,"0")}-receipt-finalized.txt`),`${raw.stdout}\n${raw.stderr}`);return raw;}Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5000);}throw new Error(`${hash} did not reach FINALIZED or another terminal receipt state within the 500-second poll window`);}
function sourceVerify(address){return spawnSync(process.execPath,[path.resolve("scripts/live/verify_source.mjs"),"--address",address,"--rpc",rpc],{encoding:"utf8",windowsHide:true});}
let liveClient;
async function getLiveClient(){
 if(liveClient)return liveClient;
 if(!plan.account_name)throw new Error("SDK writes require plan.account_name for an unlocked local CLI keystore account");
 const [{Wallet},{createAccount,createClient},{studionet}]=await Promise.all([import("ethers"),import("genlayer-js"),import("genlayer-js/chains")]);
 const exported=path.join(outDir,"temporary-encrypted-account.json");const exportPassword=crypto.randomBytes(32).toString("hex");
 const result=spawnSync(process.execPath,[cliEntry,"account","export","--account",plan.account_name,"--output",exported,"--password",exportPassword],{encoding:"utf8",windowsHide:true});
 try{
  if(result.error||result.status!==0)throw new Error(`Could not export unlocked local account: ${(result.stderr||result.stdout||result.error?.message||"").slice(0,500)}`);
  const wallet=await Wallet.fromEncryptedJson(fs.readFileSync(exported,"utf8"),exportPassword);
  if(plan.deployer_address&&wallet.address.toLowerCase()!==plan.deployer_address.toLowerCase())throw new Error("Unlocked account does not match plan.deployer_address");
  record.deployer_address=wallet.address;liveClient=createClient({chain:studionet,account:createAccount(wallet.privateKey)});return liveClient;
 }finally{fs.rmSync(exported,{force:true});}
}
async function write(address,method,values,name){
 const submittedAt=new Date().toISOString();const client=await getLiveClient();let hash;
 try{hash=await client.writeContract({address,functionName:method,args:values||[],value:0n});}
 catch(error){throw Object.assign(new Error(`${method} submission failed: ${error instanceof Error?error.message:String(error)}`),{evidence:{kind:"write_failure",name:name||method,method,args:values,submitted_at:submittedAt,submission_error:error instanceof Error?error.message:String(error)}});}
 const accepted=receipt(hash,"ACCEPTED");const acceptedInfo=receiptSummary(accepted,"ACCEPTED");const finalized=receipt(hash,"FINALIZED");const finalizedInfo=receiptSummary(finalized,"FINALIZED");
 const evidence={kind:"write",name:name||method,method,args:values,transaction_hash:hash,submitted_at:submittedAt,accepted:{observed_at:new Date().toISOString(),...acceptedInfo,stdout:accepted.stdout,stderr:accepted.stderr},finalized:{observed_at:new Date().toISOString(),...finalizedInfo,stdout:finalized.stdout,stderr:finalized.stderr}};
 if(!["ACCEPTED","FINALIZED"].includes(acceptedInfo.observed_status)||finalizedInfo.observed_status!=="FINALIZED"||finalizedInfo.consensus_result!=="MAJORITY_AGREE"||finalizedInfo.leader_execution_result!=="SUCCESS")throw Object.assign(new Error(`${method} did not finalize with a majority-agreed successful execution`),{evidence});
 return evidence;
}

try{
if(!record.contract_address){const submittedAt=new Date().toISOString();const d=cli(["deploy","--contract","contracts/cutover.py","--rpc",rpc],"deploy");const text=d.stdout+d.stderr;const tx=labeledValue(text,"Deployment Transaction Hash",64);const address=labeledValue(text,"Contract Address",40);if(!tx||!address)throw new Error("Deployment output did not expose labeled transaction hash and contract address; refusing to infer metadata from unrelated addresses");record.contract_address=address;record.deployment={transaction_hash:tx,address,rpc,submitted_at:submittedAt};save();}
 if(record.contract_address){const tx=plan.deployment_tx_hash||record.deployment?.transaction_hash;if(tx){const accepted=receipt(tx,"ACCEPTED");const acceptedInfo=receiptSummary(accepted,"ACCEPTED");const finalized=receipt(tx,"FINALIZED");const finalizedInfo=receiptSummary(finalized,"FINALIZED");record.deployment??={transaction_hash:tx,address:record.contract_address,rpc};Object.assign(record.deployment,{accepted:{observed_at:new Date().toISOString(),...acceptedInfo,stdout:accepted.stdout,stderr:accepted.stderr},finalized:{observed_at:new Date().toISOString(),...finalizedInfo,stdout:finalized.stdout,stderr:finalized.stderr}});if(finalizedInfo.observed_status!=="FINALIZED"||finalizedInfo.consensus_result!=="MAJORITY_AGREE"||finalizedInfo.leader_execution_result!=="SUCCESS")throw new Error("Deployment was not finalized with a majority-agreed successful execution");save();}const verify=sourceVerify(record.contract_address);record.deployment??={address:record.contract_address,rpc};record.deployment.source_verification={exit_code:verify.status,stdout:verify.stdout,stderr:verify.stderr};if(verify.error)throw new Error(`Source verification could not start: ${verify.error.message}`);if(verify.status!==0)throw new Error("Deployed source verification failed; refusing to continue live writes");save();}
 for(const step of plan.steps||[]){let evidence;if(step.kind==="write")evidence=await write(record.contract_address,step.method,step.args,step.name);else if(step.kind==="call"){const argv=["call",record.contract_address,step.method,"--rpc",rpc];for(const v of step.args||[])argv.push("--args",typeof v==="string"?v:JSON.stringify(v));const r=cli(argv,`call-${step.name||step.method}`);evidence={kind:"call",name:step.name||step.method,method:step.method,args:step.args||[],stdout:r.stdout,stderr:r.stderr};}else throw new Error(`Unknown step kind ${step.kind}`);record.steps.push(evidence);save();}
 record.completed=true;record.completed_at=new Date().toISOString();save();console.log(JSON.stringify({run_directory:outDir,contract_address:record.contract_address,completed:true},null,2));
}catch(error){record.completed=false;record.failed_at=new Date().toISOString();record.error=error instanceof Error?error.message:String(error);if(error?.evidence)record.steps.push(error.evidence);if(error?.item)record.steps.push({kind:"failure",...error.item});save();throw error;}
