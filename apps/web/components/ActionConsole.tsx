"use client";
import React,{useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {NETWORK,isConfigured} from "@/lib/config";
import {readCutover,writeCutover,type Eip1193Provider} from "@/lib/contract";
import {actionPolicy,type MigrationState} from "@/lib/policy";
import {WRITE_EXAMPLES,WRITE_METHODS,writeArityIsValid} from "@/lib/surface";
import {waitForFinality,TxPhase} from "@/lib/tx";

type EthereumProvider=Eip1193Provider;
declare global { interface Window { ethereum?: EthereumProvider } }

export type ActionMigrationSnapshot={
  state:MigrationState;
  owner:string;
  baselineSealed:boolean;
  candidateGeneration:number;
  assessedGeneration:number;
  challengeOpen:boolean;
  challengeUsedGeneration:number;
  reviewDeadline:number;
  authorized:boolean;
};

function chainHex(){return "0x"+NETWORK.chainId.toString(16)}

function suggestedMethod(migration?:ActionMigrationSnapshot){
  if(!migration)return "create_migration";
  if(migration.state==="DRAFT")return "add_route";
  if(migration.state==="BASELINED")return "set_candidate";
  if(["CANDIDATE","BLOCKED","INCONCLUSIVE"].includes(migration.state))return "assess_route";
  if(migration.state==="READY")return "open_challenge";
  if(migration.state==="CHALLENGED")return "reassess_challenge";
  return "authorize";
}

export function ActionConsole({migrationId,migration}:{migrationId?:string,migration?:ActionMigrationSnapshot}){
  const router=useRouter();
  const [account,setAccount]=useState<`0x${string}`|null>(null);
  const [networkOk,setNetworkOk]=useState(false);
  const [now,setNow]=useState(()=>Math.floor(Date.now()/1000));
  const [method,setMethod]=useState<string>(()=>suggestedMethod(migration));
  const example=(name:string)=>JSON.stringify(WRITE_EXAMPLES[name]??[],null,2);
  const initial=useMemo(()=>{
    const found=example(method);
    if(!migrationId)return found;
    try{const a=JSON.parse(found);if(typeof a[0]==="number")a[0]=Number(migrationId);return JSON.stringify(a,null,2)}catch{return found}
  },[method,migrationId]);
  const [args,setArgs]=useState(initial);
  const [phase,setPhase]=useState<TxPhase|null>(null);
  const [message,setMessage]=useState("Wallet disconnected.");
  const [confirmed,setConfirmed]=useState<unknown>(null);

  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000);
    return()=>window.clearInterval(timer);
  },[]);

  const policy=useMemo(()=>{
    if(!migration)return null;
    return actionPolicy({
      state:migration.state,
      isOwner:Boolean(account)&&account?.toLowerCase()===migration.owner.toLowerCase(),
      baselineSealed:migration.baselineSealed,
      candidateGeneration:migration.candidateGeneration,
      assessedGeneration:migration.assessedGeneration,
      challengeOpen:migration.challengeOpen,
      challengeUsedGeneration:migration.challengeUsedGeneration,
      reviewDeadline:migration.reviewDeadline,
      now,
      authorized:migration.authorized,
      networkOk,
    });
  },[migration,account,networkOk,now]);

  function allowedFor(name:string){
    if(!migration)return name==="create_migration";
    if(!policy)return false;
    const map:Record<string,boolean>={
      create_migration:false,
      add_route:policy.addRoute,
      freeze_route:policy.addRoute,
      seal_baseline:policy.sealBaseline,
      set_candidate:policy.setCandidate,
      assess_route:policy.assess,
      derive_candidate:policy.derive,
      open_challenge:policy.challenge,
      reassess_challenge:migration.state==="CHALLENGED"&&migration.challengeOpen&&networkOk,
      authorize:policy.authorize,
      cancel_migration:policy.cancel,
    };
    return Boolean(map[name]);
  }

  function select(name:string){
    setMethod(name);
    const found=example(name);
    try{const a=JSON.parse(found);if(migrationId&&typeof a[0]==="number")a[0]=Number(migrationId);setArgs(JSON.stringify(a,null,2))}catch{setArgs(found)}
    setPhase(null);setConfirmed(null);
  }

  async function connect(){
    if(!window.ethereum){setMessage("No injected EIP-1193 wallet found.");return}
    const result=await window.ethereum.request({method:"eth_requestAccounts"});
    const addr=Array.isArray(result)&&typeof result[0]==="string"?result[0] as `0x${string}`:undefined;
    if(!addr){setMessage("Wallet returned no account.");return}
    const cid=String(await window.ethereum.request({method:"eth_chainId"})).toLowerCase();
    const ok=cid===chainHex().toLowerCase();
    setAccount(addr);setNetworkOk(ok);
    setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch the wallet to Studionet 61999 before signing.");
  }

  async function switchNetwork(){
    if(!window.ethereum)return;
    try{
      await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:chainHex()}]});
    }catch{
      await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:chainHex(),chainName:"GenLayer Studionet",nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18},rpcUrls:[NETWORK.rpc],blockExplorerUrls:[NETWORK.explorer]}]});
    }
    await connect();
  }

  function disconnect(){
    setAccount(null);setNetworkOk(false);setPhase(null);setConfirmed(null);
    setMessage("Disconnected in CUTOVER. The wallet extension may remain authorized independently.");
  }

  async function submit(){
    if(!isConfigured()){setMessage("Contract not configured yet.");return}
    if(!window.ethereum||!account){setMessage("Connect an injected wallet first.");return}
    if(!networkOk){setMessage("Wrong network: CUTOVER writes require Studionet 61999.");return}
    if(!allowedFor(method)){setMessage("This action is unavailable for the finalized migration state or connected account.");return}
    let parsed:unknown[];
    try{parsed=JSON.parse(args);if(!Array.isArray(parsed))throw new Error()}catch{setMessage("Arguments must be a JSON array.");return}
    if(!writeArityIsValid(method,parsed)){setMessage("Argument count does not match the tracked CUTOVER contract schema.");return}
    try{
      setConfirmed(null);setPhase("awaiting_signature");setMessage("Awaiting wallet signature…");
      const hash=await writeCutover(account,window.ethereum,method,parsed);
      setMessage(`Submitted ${String(hash)}`);
      await waitForFinality(hash,(p)=>{setPhase(p);setMessage(p.replaceAll("_"," "))});
      const mid=method==="create_migration"?null:(parsed[0] as number|undefined);
      if(mid){
        const reread=await readCutover("get_migration",[mid]);
        setConfirmed(reread);
        setMessage("Execution succeeded and finalized contract state was re-read.");
        router.refresh();
      }else{
        const stats=await readCutover("get_stats");
        setConfirmed(stats);
        setMessage("Execution succeeded. Finalized contract stats were re-read; open the migration register for the new ID.");
        router.refresh();
      }
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
  }

  const canSubmit=Boolean(account)&&networkOk&&isConfigured()&&allowedFor(method);

  return <section className="panel" aria-labelledby="operator-actions">
    <div className="eyebrow">Injected-wallet operator surface</div>
    <h2 id="operator-actions">Contract actions</h2>
    <p className="muted">The button is enabled only when the finalized migration state, connected account and network permit the selected transition. The contract remains authoritative and re-checks every invariant.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {!account?<button className="button" onClick={connect}>Connect wallet</button>:<><span className="mono">{account.slice(0,8)}…{account.slice(-6)}</span><button className="button" onClick={disconnect}>Disconnect</button></>}
      {account&&!networkOk&&<button className="button hot" onClick={switchNetwork}>Switch to 61999</button>}
    </div>
    <label>Action<br/><select aria-label="Contract action" value={method} onChange={e=>select(e.target.value)} style={{width:"100%",padding:10,marginTop:6}}>{WRITE_METHODS.map(n=><option key={n}>{n}</option>)}</select></label>
    <br/><br/>
    <label>Arguments (JSON array)<br/><textarea aria-label="Write arguments" value={args} onChange={e=>setArgs(e.target.value)} rows={8} className="mono" style={{width:"100%",padding:10,marginTop:6}}/></label>
    {migration&&<p className="muted">Current finalized state: <b>{migration.state}</b>. Selected action: <b>{allowedFor(method)?"available":"unavailable"}</b>.</p>}
    <div style={{display:"flex",gap:10,alignItems:"center",marginTop:12,flexWrap:"wrap"}}>
      <button className="button hot" disabled={!canSubmit} onClick={submit}>Submit write</button>
      <span className="status">{phase?phase.replaceAll("_"," ").toUpperCase():"IDLE"}</span>
    </div>
    <p role="status" aria-live="polite">{message}</p>
    {confirmed!==null&&<details><summary>Post-finalization contract re-read</summary><pre className="mono" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(confirmed,null,2)}</pre></details>}
  </section>
}
