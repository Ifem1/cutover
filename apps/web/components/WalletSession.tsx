"use client";
import React,{createContext,useContext,useEffect,useState} from "react";
import {NETWORK} from "@/lib/config";
import type {Eip1193Provider} from "@/lib/contract";

declare global{interface Window{ethereum?:Eip1193Provider}}

type WalletState={
  account:`0x${string}`|null;
  networkOk:boolean;
  message:string;
  provider:Eip1193Provider|undefined;
  connect:()=>Promise<void>;
  switchNetwork:()=>Promise<void>;
  disconnect:()=>void;
};
const WalletContext=createContext<WalletState|null>(null);
const chainHex=()=>`0x${NETWORK.chainId.toString(16)}`;

export function WalletSessionProvider({children}:{children:React.ReactNode}){
  const [account,setAccount]=useState<`0x${string}`|null>(null);
  const [networkOk,setNetworkOk]=useState(false);
  const [message,setMessage]=useState("Wallet disconnected.");
  const provider=typeof window!=="undefined"?window.ethereum:undefined;

  async function refreshNetwork(p=provider){
    if(!p){setNetworkOk(false);return;}
    const cid=String(await p.request({method:"eth_chainId"})).toLowerCase();
    const ok=cid===chainHex().toLowerCase();
    setNetworkOk(ok);
    if(account)setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing.");
  }
  async function connect(){
    if(!provider){setMessage("No injected EIP-1193 wallet found.");return;}
    const result=await provider.request({method:"eth_requestAccounts"});
    const addr=Array.isArray(result)&&typeof result[0]==="string"?result[0] as `0x${string}`:null;
    if(!addr){setMessage("Wallet returned no account.");return;}
    setAccount(addr);
    const cid=String(await provider.request({method:"eth_chainId"})).toLowerCase();
    const ok=cid===chainHex().toLowerCase(); setNetworkOk(ok);
    setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing.");
  }
  async function switchNetwork(){
    if(!provider)return;
    try{await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:chainHex()}]});}
    catch{await provider.request({method:"wallet_addEthereumChain",params:[{chainId:chainHex(),chainName:"GenLayer Studionet",nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18},rpcUrls:[NETWORK.rpc],blockExplorerUrls:[NETWORK.explorer]}]});}
    await refreshNetwork(provider);
  }
  function disconnect(){setAccount(null);setNetworkOk(false);setMessage("Disconnected in CUTOVER. The wallet extension may remain authorized independently.");}

  useEffect(()=>{
    if(!provider?.on)return;
    const accounts=(value:unknown)=>{
      const list=Array.isArray(value)?value:[]; const next=typeof list[0]==="string"?list[0] as `0x${string}`:null;
      setAccount(next); if(!next){setNetworkOk(false);setMessage("Wallet account disconnected.");}
    };
    const chain=(value:unknown)=>{
      const ok=String(value).toLowerCase()===chainHex().toLowerCase(); setNetworkOk(ok);
      setMessage(ok?"Connected to Studionet 61999.":"Wallet network changed. CUTOVER writes are disabled until Studionet 61999 is restored.");
    };
    provider.on("accountsChanged",accounts); provider.on("chainChanged",chain);
    return()=>{provider.removeListener?.("accountsChanged",accounts);provider.removeListener?.("chainChanged",chain);};
  },[provider]);

  const value={account,networkOk,message,provider,connect,switchNetwork,disconnect};
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(){const value=useContext(WalletContext);if(!value)throw new Error("useWallet must be used inside WalletSessionProvider");return value;}

export function WalletBar(){
  const w=useWallet();
  return <div className="walletBar" aria-label="Wallet status">
    <div><span className={`statusPill ${w.networkOk?"ok":"warn"}`}>{w.networkOk?"Studionet 61999":"Wallet / network"}</span><span className="mono walletAccount">{w.account?`${w.account.slice(0,8)}…${w.account.slice(-6)}`:w.message}</span></div>
    <div className="buttonRow">{!w.account?<button className="button" onClick={w.connect}>Connect wallet</button>:<><button className="button ghost" onClick={w.disconnect}>Disconnect</button>{!w.networkOk&&<button className="button hot" onClick={w.switchNetwork}>Switch to 61999</button>}</>}</div>
  </div>;
}
