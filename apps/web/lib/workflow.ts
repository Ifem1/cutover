export const MAX_ORDINARY_ATTEMPTS=3;
export const MAX_CHALLENGES_PER_GENERATION=3;

export function manifestUrlForOrigin(origin:string){
  return `${origin.replace(/\/+$/,'')}/.well-known/cutover.json`;
}

export function isSafeCandidatePath(path:string){
  return /^\/(?!\/)/.test(path) && !path.includes('..') && !/[?#]/.test(path);
}

export function reviewProgress(now:number,readyAt:number,deadline:number){
  if(!readyAt||!deadline||deadline<=readyAt)return 0;
  return Math.min(1,Math.max(0,(now-readyAt)/(deadline-readyAt)));
}

export function assessmentCanRun(state:string,currentResult:string|undefined,attemptCount:number){
  if(!['CANDIDATE','BLOCKED','INCONCLUSIVE'].includes(state))return false;
  if(currentResult==='READY'||currentResult==='BLOCKED')return false;
  return attemptCount<MAX_ORDINARY_ATTEMPTS;
}

function sortValue(value:unknown):unknown{
  if(Array.isArray(value))return value.map(sortValue);
  if(value&&typeof value==='object'){
    const out:Record<string,unknown>={};
    for(const key of Object.keys(value as Record<string,unknown>).sort())out[key]=sortValue((value as Record<string,unknown>)[key]);
    return out;
  }
  return value;
}

export function canonicalJson(value:unknown){return JSON.stringify(sortValue(value));}

export async function sha256CanonicalJson(text:string){
  const parsed=JSON.parse(text) as unknown;
  const bytes=new TextEncoder().encode(canonicalJson(parsed));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
