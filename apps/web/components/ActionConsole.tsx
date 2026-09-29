"use client";
import {useMemo,useState} from "react";
import {NETWORK,isConfigured} from "@/lib/config";
import {readCutover,writeCutover} from "@/lib/contract";
import {waitForFinality,TxPhase} from "@/lib/tx";

type EthereumProvider={request:(args:{method:string;params?:unknown[]})=>Promise<any>};
declare global { interface Window { ethereum?: EthereumProvider } }

const WRITES=[
  ["create_migration",'["Site migration","https://old.example.com",3600]'],
  ["add_route",'[1,"pricing","https://old.example.com/pricing","/pricing","[]"]'],
  ["freeze_route",'[1,"pricing","https://proof.example/baseline.json","{}","sha256"]'],
  ["seal_baseline","[1]"],
  ["set_candidate",'[1,"https://candidate.example.com","git-commit-or-deployment-ref"]'],
  ["assess_route",'[1,"pricing"]'],
  ["derive_candidate","[1,0]"],
  ["open_challenge",'[1,"pricing","https://proof.example/challenge","bounded challenge evidence"]'],
  ["reassess_challenge","[1]"],
  ["authorize","[1,0]"],
  ["cancel_migration","[1]"],
] as const;

function chainHex(){return "0x"+NETWORK.chainId.toString(16)}

export function ActionConsole({migrationId}:{migrationId?:string}){
  const [account,setAccount]=useState<`0x${string}`|null>(null);
  const [networkOk,setNetworkOk]=useState(false);
  const [method,setMethod]=useState<string>(migrationId?"set_candidate":"create_migration");
  const initial=useMemo(()=>{
    const found=WRITES.find(([name])=>name===method)?.[1]||"[]";
    if(!migrationId) return found;
    try{const a=JSON.parse(found); if(typeof a[0]==="number") a[0]=Number(migrationId); return JSON.stringify(a,null,2)}catch{return found}
  },[method,migrationId]);
  const [args,setArgs]=useState(initial);
  const [phase,setPhase]=useState<TxPhase|null>(null);
  const [message,setMessage]=useState("Wallet disconnected.");
  const [confirmed,setConfirmed]=useState<any>(null);

  function select(name:string){
    setMethod(name);
    const found=WRITES.find(([n])=>n===name)?.[1]||"[]";
    try{const a=JSON.parse(found); if(migrationId&&typeof a[0]==="number") a[0]=Number(migrationId); setArgs(JSON.stringify(a,null,2))}catch{setArgs(found)}
    setPhase(null); setConfirmed(null);
  }

  async function connect(){
    if(!window.ethereum){setMessage("No injected EIP-1193 wallet found.");return}
    const accounts=await window.ethereum.request({method:"eth_requestAccounts"});
    const addr=accounts?.[0] as `0x${string}`|undefined;
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
  function disconnect(){setAccount(null);setNetworkOk(false);setPhase(null);setConfirmed(null);setMessage("Disconnected in CUTOVER. The wallet extension may remain authorized independently.");}

  async function submit(){
    if(!isConfigured()){setMessage("Contract not configured yet.");return}
    if(!window.ethereum||!account){setMessage("Connect an injected wallet first.");return}
    if(!networkOk){setMessage("Wrong network: CUTOVER writes require Studionet 61999.");return}
    let parsed:unknown[];
    try{parsed=JSON.parse(args);if(!Array.isArray(parsed))throw new Error()}catch{setMessage("Arguments must be a JSON array.");return}
    try{
      setConfirmed(null);setPhase("awaiting_signature");setMessage("Awaiting wallet signature…");
      const hash:any=await writeCutover(account,window.ethereum,method,parsed);
      setMessage(`Submitted ${String(hash)}`);
      await waitForFinality(hash,(p)=>{setPhase(p);setMessage(p.replaceAll("_"," "))});
      const mid=method==="create_migration"?null:(parsed[0] as number|undefined);
      if(mid){
        const reread=await readCutover("get_migration",[mid]);
        setConfirmed(reread);
        setMessage("Execution succeeded and finalized contract state was re-read.");
      }else setMessage("Execution succeeded. Read the migration register to confirm the newly created ID.");
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}
  }

  return <section className="panel" aria-labelledby="operator-actions">
    <div className="eyebrow">Injected-wallet operator surface</div>
    <h2 id="operator-actions">Contract actions</h2>
    <p className="muted">Every public write is reachable here. The contract remains authoritative: unavailable state transitions still revert, and CUTOVER never stores or generates a private key.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {!account?<button className="button" onClick={connect}>Connect wallet</button>:<><span className="mono">{account.slice(0,8)}…{account.slice(-6)}</span><button className="button" onClick={disconnect}>Disconnect</button></>}
      {account&&!networkOk&&<button className="button hot" onClick={switchNetwork}>Switch to 61999</button>}
    </div>
    <label>Action<br/><select aria-label="Contract action" value={method} onChange={e=>select(e.target.value)} style={{width:"100%",padding:10,marginTop:6}}>{WRITES.map(([n])=><option key={n}>{n}</option>)}</select></label>
    <br/><br/>
    <label>Arguments (JSON array)<br/><textarea aria-label="Write arguments" value={args} onChange={e=>setArgs(e.target.value)} rows={8} className="mono" style={{width:"100%",padding:10,marginTop:6}}/></label>
    <div style={{display:"flex",gap:10,alignItems:"center",marginTop:12,flexWrap:"wrap"}}>
      <button className="button hot" disabled={!account||!networkOk||!isConfigured()} onClick={submit}>Submit write</button>
      <span className="status">{phase?phase.replaceAll("_"," ").toUpperCase():"IDLE"}</span>
    </div>
    <p role="status" aria-live="polite">{message}</p>
    {confirmed&&<details><summary>Post-finalization contract re-read</summary><pre className="mono" style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(confirmed,null,2)}</pre></details>}
  </section>
}