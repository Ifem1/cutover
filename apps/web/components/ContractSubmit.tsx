"use client";
import React,{useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {readCutover,writeCutover} from "@/lib/contract";
import {isConfigured,NETWORK} from "@/lib/config";
import {describeError,isWalletSignatureRejection} from "@/lib/errors";
import {clearPendingTransaction,loadPendingTransaction,savePendingTransaction,TxExecutionError,TxExecutionResultUnavailableError,TxTrackingError,waitForFinality,type PendingCutoverTransaction,type TxPhase} from "@/lib/tx";
import {useWallet} from "./WalletSession";

export function useContractSubmit(){
  const router=useRouter(); const wallet=useWallet();
  const [phase,setPhase]=useState<TxPhase|null>(null); const [message,setMessage]=useState("");
  const [confirmed,setConfirmed]=useState<unknown>(null); const [busy,setBusy]=useState(false);
  const [pending,setPending]=useState<PendingCutoverTransaction|null>(null);

  useEffect(()=>{
    const saved=loadPendingTransaction();
    if(saved){setPending(saved);setPhase("submitted");setMessage(`Transaction ${saved.hash} is saved for status recovery.`);}
  },[]);

  async function trackTransaction(record:PendingCutoverTransaction){
    try{
      await waitForFinality(record.hash,p=>{setPhase(p);setMessage(p.replaceAll("_"," "));});
    }catch(error){
      if(error instanceof TxExecutionError||error instanceof TxExecutionResultUnavailableError){
        const reread=record.migrationId?await readCutover("get_migration",[record.migrationId]):await readCutover("get_stats");
        clearPendingTransaction(record.hash);setPending(null);setConfirmed(reread);router.refresh();
      }else if(!(error instanceof TxTrackingError)){clearPendingTransaction(record.hash);setPending(null);}
      throw error;
    }
    const reread=record.migrationId?await readCutover("get_migration",[record.migrationId]):await readCutover("get_stats");
    clearPendingTransaction(record.hash);setPending(null);setConfirmed(reread);
    setMessage("Finalized successfully; contract state re-read from LATEST_FINAL.");router.refresh();return reread;
  }

  async function submit(method:string,args:unknown[],migrationId?:number){
    if(!isConfigured())throw new Error("CUTOVER contract not configured");
    if(!wallet.provider||!wallet.account)throw new Error("Connect an injected wallet first");
    if(!wallet.networkOk)throw new Error("Wrong network: CUTOVER writes require Studionet 61999");
    setBusy(true);setConfirmed(null);setPhase("awaiting_signature");setMessage("Awaiting wallet signature…");
    let hashSubmitted=false;
    try{
      const hash=await writeCutover(wallet.account,wallet.provider,method,args);
      hashSubmitted=true;
      const record:PendingCutoverTransaction={hash,method,migrationId,submittedAt:Date.now()};
      const recoverable=savePendingTransaction(record);setPending(record);setMessage(recoverable?`Submitted ${hash}`:`Submitted ${hash}. Browser storage is unavailable; keep this page open and save the hash before refreshing.`);
      return await trackTransaction(record);
    }catch(error){
      if(isWalletSignatureRejection(error)){setPhase("signature_rejected");setMessage("Wallet signature was rejected; no transaction was submitted.");}
      else{setMessage(describeError(error));if(!hashSubmitted)setPhase("submission_error");}
      throw error;
    }finally{setBusy(false);}
  }

  async function recover(){
    const record=pending??loadPendingTransaction();
    if(!record)return;
    setPending(record);setBusy(true);setConfirmed(null);setPhase("submitted");setMessage(`Checking saved transaction ${record.hash} on Studionet…`);
    try{return await trackTransaction(record);}
    catch(error){setMessage(describeError(error));throw error;}
    finally{setBusy(false);}
  }

  return {submit,recover,phase,message,confirmed,busy,wallet,pending};
}

export function TxFeedback({phase,message,confirmed,pending,onRecover,busy}:{
  phase:TxPhase|null;message:string;confirmed:unknown;pending:PendingCutoverTransaction|null;onRecover:()=>Promise<unknown>;busy:boolean;
}){
  if(!message&&!phase&&!pending)return null;
  return <div className="txFeedback">
    <div className="txStatus" role="status" aria-live="polite"><b>{phase?phase.replaceAll("_"," ").toUpperCase():"STATUS"}</b><span>{message}</span></div>
    {pending&&<div className="txRecovery"><code>{pending.hash}</code><a href={NETWORK.explorer} target="_blank" rel="noreferrer">Open Studionet explorer ↗</a><button type="button" className="textButton" disabled={busy} onClick={()=>void onRecover().catch(()=>undefined)}>{busy?"Checking status…":"Resume status tracking"}</button></div>}
    {confirmed!==null&&<details><summary>Finalized state re-read</summary><pre>{JSON.stringify(confirmed,null,2)}</pre></details>}
  </div>;
}
