#!/usr/bin/env node
/** Build or verify the fixture manifest from the actual deployed response bytes. */
import crypto from "node:crypto";

const argv=process.argv.slice(2);
function value(name,fallback=""){const i=argv.indexOf(name);return i<0?fallback:argv[i+1]||"";}
const verify=argv.includes("--verify");
const origin=value("--origin").replace(/\/+$/g,"");
if(!/^https:\/\//.test(origin)||new URL(origin).origin!==origin)throw new Error("--origin must be one HTTPS origin, without a trailing slash");
const hash=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
function canonical(value){if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;return JSON.stringify(value);}
async function fetchSameOrigin(url){const response=await fetch(url,{redirect:"manual",cache:"no-store"});if(response.status>=300&&response.status<400)throw new Error(`Refusing redirect from ${url}: HTTP ${response.status}`);return response;}

if(verify){
  const response=await fetchSameOrigin(`${origin}/.well-known/cutover.json`);
  if(!response.ok)throw new Error(`Manifest fetch failed: HTTP ${response.status}`);
  const manifest=await response.json();
  if(manifest.schema_version!=="cutover.candidate.v1"||manifest.candidate_origin!==origin||typeof manifest.release_ref!=="string"||!manifest.release_ref||!Array.isArray(manifest.routes))throw new Error("Manifest schema or origin identity is invalid");
  const expectedRef=value("--expected-release-ref");if(expectedRef&&manifest.release_ref!==expectedRef)throw new Error(`Manifest release ref ${manifest.release_ref} does not match expected ${expectedRef}`);
  const routes=[];
  for(const entry of manifest.routes){
    if(!entry||typeof entry.route_id!=="string"||typeof entry.path!=="string"||!/^[0-9a-f]{64}$/.test(entry.content_sha256))throw new Error("Manifest route entry is malformed");
    const url=new URL(entry.path,origin);if(url.origin!==origin||url.pathname!==entry.path||url.search||url.hash)throw new Error(`Unsafe manifest route path: ${entry.path}`);
    const route=await fetchSameOrigin(url.toString());if(!route.ok)throw new Error(`Route ${entry.route_id} fetch failed: HTTP ${route.status}`);
    const digest=hash(Buffer.from(await route.arrayBuffer()));routes.push({route_id:entry.route_id,path:entry.path,expected_sha256:entry.content_sha256,actual_sha256:digest,match:digest===entry.content_sha256});
  }
  const manifestDigest=hash(Buffer.from(canonical(manifest),"utf8"));
  const result={verified:routes.every(x=>x.match),candidate_origin:origin,release_ref:manifest.release_ref,manifest_sha256:manifestDigest,routes};
  console.log(JSON.stringify(result,null,2));if(!result.verified)process.exitCode=2;
}else{
  const releaseRef=value("--release-ref");if(!releaseRef||releaseRef.length>180)throw new Error("--release-ref is required and must be at most 180 characters");
  const routeArgs=[];for(let i=0;i<argv.length;i++)if(argv[i]==="--route")routeArgs.push(argv[++i]||"");
  if(!routeArgs.length||routeArgs.length>24)throw new Error("Supply 1–24 --route route_id=/path arguments");
  const routes=[];const seen=new Set();
  for(const item of routeArgs){const cut=item.indexOf("=");if(cut<1)throw new Error(`Malformed route argument ${item}`);const route_id=item.slice(0,cut);const path=item.slice(cut+1);if(seen.has(route_id)||!/^\/[A-Za-z0-9/_-]+$/.test(path)||path.includes(".."))throw new Error(`Invalid or duplicate route mapping ${item}`);seen.add(route_id);const url=new URL(path,origin);const first=await fetchSameOrigin(url.toString());if(!first.ok)throw new Error(`Route ${route_id} fetch failed: HTTP ${first.status}`);const firstBytes=Buffer.from(await first.arrayBuffer());const second=await fetchSameOrigin(url.toString());if(!second.ok)throw new Error(`Second route ${route_id} fetch failed: HTTP ${second.status}`);const secondBytes=Buffer.from(await second.arrayBuffer());const content_sha256=hash(firstBytes);if(!firstBytes.equals(secondBytes))throw new Error(`Route ${route_id} changed between manifest reads; refusing to freeze its digest`);routes.push({route_id,path,content_sha256});}
  routes.sort((a,b)=>a.route_id.localeCompare(b.route_id));
  const manifest={schema_version:"cutover.candidate.v1",candidate_origin:origin,release_ref:releaseRef,routes};
  const manifestJson=JSON.stringify(manifest);const manifestDigest=hash(Buffer.from(canonical(manifest),"utf8"));
  console.log(JSON.stringify({manifest,manifest_sha256:manifestDigest,vercel_environment:{name:"CUTOVER_CANDIDATE_MANIFEST_JSON",value:manifestJson},note:"Set this value on the fixture Vercel project, redeploy, then rerun with --verify."},null,2));
}
