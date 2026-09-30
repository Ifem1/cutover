"use client";
import React,{useMemo,useState} from "react";
import {WRITE_EXAMPLES,WRITE_METHODS,writeArityIsValid} from "@/lib/surface";
import {useContractSubmit,TxFeedback} from "./ContractSubmit";

export function ActionConsole({migrationId}:{migrationId?:string}){
  const tx=useContractSubmit(); const [method,setMethod]=useState(migrationId?"add_route":"create_migration");
  const initial=useMemo(()=>{
    const a=[...(WRITE_EXAMPLES[method]??[])]; if(migrationId&&typeof a[0]==="number")a[0]=Number(migrationId); return JSON.stringify(a,null,2);
  },[method,migrationId]);
  const [args,setArgs]=useState(initial);
  function select(next:string){setMethod(next);const a=[...(WRITE_EXAMPLES[next]??[])];if(migrationId&&typeof a[0]==="number")a[0]=Number(migrationId);setArgs(JSON.stringify(a,null,2));}
  async function submit(){let parsed:unknown[];try{parsed=JSON.parse(args);if(!Array.isArray(parsed))throw new Error();}catch{throw new Error("Arguments must be a JSON array");}if(!writeArityIsValid(method,parsed))throw new Error("Argument count does not match contract surface");await tx.submit(method,parsed,migrationId?Number(migrationId):undefined);}
  return <details className="advanced panel"><summary>Advanced / developer contract console</summary><p className="muted">Raw ABI-shaped access for debugging only. The guided workflow above is the primary product surface.</p><label>Method<select aria-label="Developer contract method" value={method} onChange={e=>select(e.target.value)}>{WRITE_METHODS.map(n=><option key={n}>{n}</option>)}</select></label><label>Arguments<textarea aria-label="Developer contract arguments" rows={9} value={args} onChange={e=>setArgs(e.target.value)}/></label><button type="button" className="button" disabled={tx.busy||!tx.wallet.account||!tx.wallet.networkOk} onClick={()=>void submit().catch(()=>undefined)}>Submit raw write</button><TxFeedback phase={tx.phase} message={tx.message} confirmed={tx.confirmed} pending={tx.pending} onRecover={tx.recover} busy={tx.busy}/></details>;
}
