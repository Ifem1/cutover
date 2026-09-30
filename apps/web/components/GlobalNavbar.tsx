"use client";

import Link from "next/link";
import React,{useEffect,useRef,useState} from "react";
import {NETWORK} from "@/lib/config";
import {useWallet} from "./WalletSession";

function shortAddress(address:string){return `${address.slice(0,6)}…${address.slice(-4)}`;}

function WalletControl(){
  const wallet=useWallet();
  const [open,setOpen]=useState(false);
  const [copied,setCopied]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    document.addEventListener("mousedown",outside);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("mousedown",outside);document.removeEventListener("keydown",escape);};
  },[open]);

  async function copyAddress(){
    if(!wallet.account)return;
    await navigator.clipboard.writeText(wallet.account);
    setCopied(true);
    window.setTimeout(()=>setCopied(false),1500);
  }

  if(!wallet.account)return <div className="walletControl" ref={root}><button className="walletTrigger disconnected" type="button" onClick={()=>void wallet.connect()} aria-label="Connect wallet">Connect wallet</button></div>;

  return <div className="walletControl" ref={root}>
    <button className={`walletTrigger ${wallet.networkOk?"connected":"wrongNetwork"}`} type="button" aria-expanded={open} aria-controls="wallet-menu" onClick={()=>setOpen(value=>!value)}>
      <span aria-hidden="true">{wallet.networkOk?"●":"!"}</span>{wallet.networkOk?shortAddress(wallet.account):"Wrong network"}
    </button>
    {open&&<div className="walletMenu" id="wallet-menu" role="region" aria-label="Connected wallet">
      <div className="walletMenuTitle">Connected wallet</div>
      <code className="walletMenuAddress">{wallet.account}</code>
      <button className="walletMenuAction" type="button" onClick={()=>void copyAddress()}>{copied?"Address copied":"Copy address"}</button>
      <div className={`walletNetwork ${wallet.networkOk?"ok":"warn"}`}>
        <span className="eyebrow">Network</span>
        <b>{wallet.networkOk?"Studionet · 61999":`Wrong network${wallet.chainId?` · ${wallet.chainId}`:""}`}</b>
      </div>
      {!wallet.networkOk&&<button className="button hot walletMenuPrimary" type="button" onClick={()=>void wallet.switchNetwork().catch(()=>undefined)}>Switch to Studionet</button>}
      <a className="walletExplorer" href={NETWORK.explorer} target="_blank" rel="noreferrer">Open Studionet explorer ↗</a>
      <button className="walletMenuAction disconnectAction" type="button" onClick={()=>{wallet.disconnect();setOpen(false);}}>Disconnect</button>
    </div>}
  </div>;
}

export function GlobalNavbar(){
  return <header className="wrap nav">
    <Link className="brand" href="/">CUTOVER</Link>
    <nav className="navlinks" aria-label="Primary">
      <Link href="/migrations">Migrations</Link><Link href="/verify">Verify</Link><Link href="/integrations/github">GitHub gate</Link><Link href="/how">How it works</Link><Link href="/security">Security</Link>
    </nav>
    <WalletControl/>
  </header>;
}
