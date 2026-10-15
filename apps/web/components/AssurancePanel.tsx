"use client";
import React,{FormEvent,useEffect,useMemo,useState} from "react";
import {useContractSubmit,TxFeedback} from "./ContractSubmit";
import {useWallet} from "./WalletSession";

type AssuranceRoute={route_id:string;candidate_path:string;rules?:{id:string}[]};
export type AssuranceRecord={status?:string;started_at?:number;deadline?:number;window_seconds?:number;required_checkpoints?:number;checkpoint_count?:number;latest_versions?:Record<string,number>;candidate_generation?:number;candidate_ref?:string;candidate_manifest_digest?:string;authorization_digest?:string;final_result?:string;finalized_at?:number};
export type AssuranceCheckpoint={route_id:string;checkpoint_version:number;submitted_at?:number;route_result?:string;evidence_url?:string;evidence_digest?:string;candidate_probe_digest?:string;findings?:{rule_id:string;status:string;reason?:string}[];checkpoint_digest?:string;manifest_match?:boolean;content_match?:boolean;source_match?:boolean;evidence_available?:boolean};

const stamp=(value?:number)=>value?new Date(value*1000).toISOString():"Not started";
const terminal=(status?:string)=>status==="VERIFIED"||status==="DEVIATED"||status==="INCONCLUSIVE";

export function AssurancePanel({migrationId,owner,state,routes,assurance,checkpoints}:{migrationId:number;owner:string;state:string;routes:AssuranceRoute[];assurance:AssuranceRecord;checkpoints:AssuranceCheckpoint[]}){
  const wallet=useWallet(); const tx=useContractSubmit();
  const [now,setNow]=useState(()=>Math.floor(Date.now()/1000)); const [windowSeconds,setWindowSeconds]=useState("60");
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000);return()=>window.clearInterval(timer);},[]);
  const isOwner=Boolean(wallet.account)&&wallet.account?.toLowerCase()===owner.toLowerCase();
  const observing=assurance.status==="OBSERVING"; const eligible=state==="AUTHORIZED"&&!assurance.status;
  const canWrite=isOwner&&wallet.networkOk&&!tx.busy;
  const deadline=Number(assurance.deadline||0); const progress=observing&&deadline>Number(assurance.started_at||0)?Math.max(0,Math.min(100,((now-Number(assurance.started_at||0))/(deadline-Number(assurance.started_at||0)))*100)):terminal(assurance.status)?100:0;
  const latest=useMemo(()=>assurance.latest_versions||{},[assurance.latest_versions]);
  const nextRoutes=useMemo(()=>routes.map(route=>({route,version:Number(latest[route.route_id]||0)+1,checkpoint:checkpoints.filter(item=>item.route_id===route.route_id).at(-1)})),[routes,latest,checkpoints]);
  async function run(method:string,args:unknown[]){await tx.submit(method,args,migrationId);}
  return <section className="assurancePanel panel">
    <div className="workflowTitle"><span className="stepNo">A</span><div><h2>Cutover Assurance</h2><p className="muted">A separate post-authorization observation lifecycle. The original authorization remains immutable.</p></div></div>
    {!assurance.status&&<div className="assuranceIntro"><p><b>Authorized release:</b> {state==="AUTHORIZED"?"eligible to observe":"not eligible yet"}</p><p className="muted">Assurance binds to the exact authorized generation, release reference, manifest digest and approved route commitments.</p><label>Observation window (seconds)<input aria-label="Observation window seconds" inputMode="numeric" value={windowSeconds} onChange={e=>setWindowSeconds(e.target.value)} disabled={!eligible||!canWrite}/></label><button type="button" className="button hot" disabled={!eligible||!canWrite||!/^([6-9][0-9]|[1-9][0-9]{2,4}|86400)$/.test(windowSeconds)} onClick={()=>void run("begin_assurance",[migrationId,Number(windowSeconds)])}>Start assurance</button>{!isOwner&&state==="AUTHORIZED"&&<p className="muted">Migration owner wallet required to start assurance.</p>}{!wallet.networkOk&&isOwner&&<p className="fieldError">Switch to Studionet 61999 before signing.</p>}</div>}
    {observing&&<>
      <div className="assuranceIdentity"><div><small>STATUS</small><b className="assuranceStatus observing">OBSERVING</b></div><div><small>AUTHORIZED RELEASE</small><code>{assurance.candidate_ref}</code></div><div><small>GENERATION</small><code>{assurance.candidate_generation}</code></div><div><small>DEADLINE</small><code>{stamp(deadline)}</code></div></div>
      <progress aria-label="Assurance observation window progress" max={100} value={progress}/><p className="muted">{now<deadline?`${Math.max(0,deadline-now)} seconds remain in the bounded window.`:"Window elapsed. Finalization is available."} {assurance.checkpoint_count||0}/{assurance.required_checkpoints||routes.length} required route checkpoints.</p>
      <div className="assuranceCheckpoints">{nextRoutes.map(({route,version,checkpoint})=><CheckpointForm key={route.route_id} migrationId={migrationId} route={route} version={version} checkpoint={checkpoint} enabled={canWrite&&now<=deadline} onRun={run}/>)}</div>
      <button type="button" className="button hot" disabled={!canWrite||now<deadline} onClick={()=>void run("finalize_assurance",[migrationId])}>Finalize assurance</button>
    </>}
    {terminal(assurance.status)&&<ResultScreen assurance={assurance}/>} 
    {checkpoints.length>0&&<details className="assuranceTimeline" open><summary>Observation timeline ({checkpoints.length})</summary>{checkpoints.map(item=><article key={`${item.route_id}:${item.checkpoint_version}`}><div><b>{item.route_id}</b><span>checkpoint v{item.checkpoint_version} · {item.route_result}</span><small>{stamp(item.submitted_at)}</small></div><code>{item.evidence_digest||item.candidate_probe_digest||"No digest"}</code>{item.findings?.length?<ul>{item.findings.map(f=><li key={f.rule_id}><b>{f.rule_id}</b>: {f.status}{f.reason?` — ${f.reason}`:""}</li>)}</ul>:<p className="muted">No semantic findings; identity or evidence checks were inconclusive.</p>}</article>)}</details>}
    <TxFeedback phase={tx.phase} message={tx.message} confirmed={tx.confirmed} pending={tx.pending} onRecover={tx.recover} busy={tx.busy}/>
  </section>;
}

function CheckpointForm({migrationId,route,version,checkpoint,enabled,onRun}:{migrationId:number;route:AssuranceRoute;version:number;checkpoint?:AssuranceCheckpoint;enabled:boolean;onRun:(method:string,args:unknown[])=>Promise<void>}){
  const [url,setUrl]=useState(""); const path=route.candidate_path; const disabled=Boolean(checkpoint)||!enabled||!url;
  function submit(e:FormEvent){e.preventDefault();void onRun("submit_assurance_checkpoint",[migrationId,route.route_id,version,url]);}
  return <form className="assuranceCheckpoint panel" onSubmit={submit}><div><b>{route.route_id}</b><span>Checkpoint v{version}</span></div>{checkpoint?<p className="muted">Latest result: <b>{checkpoint.route_result}</b>. Submit the next version only if another bounded observation is needed.</p>:<><label>Production checkpoint URL<input aria-label={`${route.route_id} checkpoint URL`} type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder={path}/></label><p className="muted">Must equal the authorized candidate origin plus <code>{path}</code>; the contract re-fetches the manifest and page independently.</p><button className="button" disabled={disabled}>Submit checkpoint</button></>}</form>;
}

function ResultScreen({assurance}:{assurance:AssuranceRecord}){
  const status=assurance.status||"INCONCLUSIVE";
  const copy=status==="VERIFIED"?"All required observations preserved the authorized commitments.":status==="DEVIATED"?"Credible evidence established a material deviation from an authorized commitment.":"The required verification could not be established from the available evidence.";
  return <div className={`assuranceResult ${status.toLowerCase()}`}><div className="eyebrow">FINAL ASSURANCE RESULT</div><h3>{status}</h3><p>{copy}</p><p><b>Finalized:</b> {stamp(assurance.finalized_at)} · <b>Authorization:</b> <code>{assurance.authorization_digest}</code></p></div>;
}
