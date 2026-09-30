#!/usr/bin/env node
/** Compare the finalized Studionet contract source with the tracked bytes. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const args=process.argv.slice(2);
function option(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const address=option("--address","");
const sourcePath=path.resolve(option("--source","contracts/cutover.py"));
const rpc=option("--rpc","https://studio.genlayer.com/api");
const output=option("--write-deployed","");
if(!/^0x[a-fA-F0-9]{40}$/.test(address))throw new Error("--address must be a 20-byte contract address");
const sdk=JSON.parse(fs.readFileSync("node_modules/genlayer-js/package.json","utf8"));
if(sdk.version!=="1.1.8")throw new Error(`Refusing genlayer-js ${sdk.version}; pinned version 1.1.8 is required`);
const chainResponse=await fetch(rpc,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_chainId",params:[],id:1})});
if(!chainResponse.ok)throw new Error(`Studionet RPC returned HTTP ${chainResponse.status}`);
const chainPayload=await chainResponse.json();
if(chainPayload.error)throw new Error(JSON.stringify(chainPayload.error));
const chainId=Number.parseInt(chainPayload.result,16);
if(chainId!==61999)throw new Error(`Refusing source retrieval from chain ${chainId}; expected 61999`);
const client=createClient({chain:studionet,endpoint:rpc});
const deployedSource=await client.getContractCode(address);
if(typeof deployedSource!=="string")throw new Error("RPC returned no deployed source text");
const local=fs.readFileSync(sourcePath);
const deployed=Buffer.from(deployedSource,"utf8");
const digest=value=>crypto.createHash("sha256").update(value).digest("hex");
const result={address,rpc,chain_id:chainId,source_path:path.relative(process.cwd(),sourcePath).replaceAll("\\","/"),local_sha256:digest(local),deployed_sha256:digest(deployed),exact_match:local.equals(deployed),retrieval:"gen_getContractCode via pinned genlayer-js 1.1.8 after finalized deployment receipt"};
if(output)fs.writeFileSync(path.resolve(output),deployed);
console.log(JSON.stringify(result,null,2));
if(!result.exact_match)process.exitCode=2;
