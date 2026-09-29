"use client";
import React,{useState} from "react";
import {useRouter} from "next/navigation";
import {readCutover,writeCutover} from "@/lib/contract";
import {isConfigured} from "@/lib/config";
import {waitForFinality,type TxPhase} from "@/lib/tx";
import {useWallet} from "./WalletSession";

export function useContractSubmit(){
  const router=useRouter(); const wallet=useWallet();
  const [phase,setPhase]=useState<TxPhase|null>(null); const [message,setMessage]=useState("");
  const [confirmed,setConfirmed]=useState<unknown>(null); const [busy,setBusy]=useState(false);
  async function submit(method:string,args:unknown[],migrationId?:number){
    if(!isConfigured())throw new Error("CUTOVER contract not configured");
    if(!wallet.provider||!wallet.account)throw new Error("Connect an injected wallet first");
    if(!wallet.networkOk)throw new Error("Wrong network: CUTOVER writes require Studionet 61999");
    setBusy(true);setConfirmed(null);setPhase("awaiting_signature");setMessage("Awaiting wallet signature…");
    try{
      const hash=await writeCutover(wallet.account,wallet.provider,method,args); setMessage(`Submitted ${hash}`);
      await waitForFinality(hash,p=>{setPhase(p);setMessage(p.replaceAll("_"," "));});
      const reread=migrationId?await readCutover("get_migration",[migrationId]):await readCutover("get_stats");
      setConfirmed(reread);setMessage("Finalized successfully; contract state re-read from LATEST_FINAL.");router.refresh(); return reread;
    }catch(error){const m=error instanceof Error?error.message:String(error);setMessage(m);throw error;}finally{setBusy(false);}
  }
  return {submit,phase,message,confirmed,busy,wallet};
}

export function TxFeedback({phase,message,confirmed}:{phase:TxPhase|null;message:string;confirmed:unknown}){
  if(!message&&!phase)return null;
  return <div className="txFeedback" role="status" aria-live="polite"><b>{phase?phase.replaceAll("_"," ").toUpperCase():"STATUS"}</b><span>{message}</span>{confirmed!==null&&<details><summary>Finalized state re-read</summary><pre>{JSON.stringify(confirmed,null,2)}</pre></details>}</div>;
}
