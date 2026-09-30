"use client";
import React,{FormEvent,useState} from "react";
import {useContractSubmit,TxFeedback} from "./ContractSubmit";

export function CreateMigrationForm(){
  const tx=useContractSubmit(); const [title,setTitle]=useState("");const [origin,setOrigin]=useState("");const [windowSec,setWindowSec]=useState(3600);
  async function onSubmit(e:FormEvent){e.preventDefault();await tx.submit("create_migration",[title,origin,windowSec]);}
  return <form className="panel workflowCard" onSubmit={onSubmit}>
    <div className="stepNo">01</div><div><div className="eyebrow">Migration identity</div><h2>Create migration</h2><p className="muted">Name the cutover, bind the public baseline origin, and set the review window.</p></div>
    <label>Migration title<input aria-label="Migration title" required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Baseline origin<input aria-label="Baseline origin" type="url" required placeholder="https://old.example.com" value={origin} onChange={e=>setOrigin(e.target.value)}/></label>
    <label>Review window (seconds)<input aria-label="Review window seconds" type="number" min={300} max={604800} required value={windowSec} onChange={e=>setWindowSec(Number(e.target.value))}/></label>
    <button className="button hot" disabled={tx.busy||!tx.wallet.account||!tx.wallet.networkOk}>Create migration</button>
    <TxFeedback phase={tx.phase} message={tx.message} confirmed={tx.confirmed} pending={tx.pending} onRecover={tx.recover} busy={tx.busy}/>
  </form>;
}
