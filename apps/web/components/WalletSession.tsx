"use client";
import React,{createContext,useContext,useEffect,useRef,useState} from "react";
import {NETWORK} from "@/lib/config";
import type {Eip1193Provider} from "@/lib/contract";

declare global{interface Window{ethereum?:Eip1193Provider}}

type WalletState={
  account:`0x${string}`|null;
  chainId:number|null;
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
  const sessionRevision=useRef(0);
  const [account,setAccount]=useState<`0x${string}`|null>(null);
  const [chainId,setChainId]=useState<number|null>(null);
  const [networkOk,setNetworkOk]=useState(false);
  const [message,setMessage]=useState("Wallet disconnected.");
  const provider=typeof window!=="undefined"?window.ethereum:undefined;

  async function refreshNetwork(p=provider){
    if(!p){setChainId(null);setNetworkOk(false);return;}
    const raw=await p.request({method:"eth_chainId"});
    const cid=typeof raw==="number"?raw:Number.parseInt(String(raw),16);
    const ok=cid===NETWORK.chainId;
    setChainId(Number.isFinite(cid)?cid:null);
    setNetworkOk(ok);
    if(account)setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing.");
  }
  async function connect(){
    if(!provider){setMessage("No injected EIP-1193 wallet found.");return;}
    const revision=++sessionRevision.current;
    try{
      const result=await provider.request({method:"eth_requestAccounts"});
      if(revision!==sessionRevision.current)return;
      const addr=Array.isArray(result)&&typeof result[0]==="string"?result[0] as `0x${string}`:null;
      if(!addr){setMessage("Wallet returned no account.");return;}
      const raw=await provider.request({method:"eth_chainId"});
      if(revision!==sessionRevision.current)return;
      const cid=typeof raw==="number"?raw:Number.parseInt(String(raw),16);
      const ok=cid===NETWORK.chainId;setChainId(Number.isFinite(cid)?cid:null);setNetworkOk(ok);
      setAccount(addr);
      setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing.");
    }catch(error){setMessage(error instanceof Error?`Wallet connection failed: ${error.message}`:"Wallet connection failed.");}
  }
  async function switchNetwork(){
    if(!provider)return;
    try{
      try{await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:chainHex()}]});}
      catch(error){
        const code=typeof error==="object"&&error!==null&&"code" in error?(error as {code?:unknown}).code:null;
        if(code!==4902)throw error;
        await provider.request({method:"wallet_addEthereumChain",params:[{chainId:chainHex(),chainName:"GenLayer Studionet",nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18},rpcUrls:[NETWORK.rpc],blockExplorerUrls:[NETWORK.explorer]}]});
      }
      await refreshNetwork(provider);
    }catch(error){setMessage(error instanceof Error?`Could not switch network: ${error.message}`:"Could not switch network.");}
  }
  function disconnect(){sessionRevision.current++;setAccount(null);setNetworkOk(false);setMessage("Disconnected in CUTOVER. The wallet extension may remain authorized independently.");}

  useEffect(()=>{
    if(!provider)return;
    let active=true;
    const revision=sessionRevision.current;
    const syncNetwork=async(connected:boolean,revision:number)=>{
      try{
        const raw=await provider.request({method:"eth_chainId"});
        if(!active||revision!==sessionRevision.current)return;
        const id=typeof raw==="number"?raw:Number.parseInt(String(raw),16);
        const ok=id===NETWORK.chainId;
        setChainId(Number.isFinite(id)?id:null);setNetworkOk(ok);
        if(connected)setMessage(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing.");
      }catch{if(active&&revision===sessionRevision.current){setChainId(null);setNetworkOk(false);if(connected)setMessage("Could not read the wallet network.");}}
    };
    const accounts=(value:unknown)=>{
      const revision=++sessionRevision.current;
      const list=Array.isArray(value)?value:[]; const next=typeof list[0]==="string"?list[0] as `0x${string}`:null;
      setAccount(next);if(!next){setNetworkOk(false);setMessage("Wallet account disconnected.");}else void syncNetwork(true,revision);
    };
    const chain=(value:unknown)=>{
      sessionRevision.current++;
      const id=typeof value==="number"?value:Number.parseInt(String(value),16);
      const ok=id===NETWORK.chainId;setChainId(Number.isFinite(id)?id:null);setNetworkOk(ok);
      setMessage(ok?"Connected to Studionet 61999.":"Wallet network changed. CUTOVER writes are disabled until Studionet 61999 is restored.");
    };
    void (async()=>{
      try{
        const [accountsValue,networkValue]=await Promise.all([provider.request({method:"eth_accounts"}),provider.request({method:"eth_chainId"})]);
        if(!active||revision!==sessionRevision.current)return;
        const list=Array.isArray(accountsValue)?accountsValue:[];
        const restored=typeof list[0]==="string"?list[0] as `0x${string}`:null;
        const id=typeof networkValue==="number"?networkValue:Number.parseInt(String(networkValue),16);
        const ok=id===NETWORK.chainId;
        setAccount(restored);setChainId(Number.isFinite(id)?id:null);setNetworkOk(Boolean(restored)&&ok);
        setMessage(restored?(ok?"Connected to Studionet 61999.":"Wrong network. Switch to Studionet 61999 before signing."):"Wallet disconnected.");
      }catch{if(active&&revision===sessionRevision.current){setAccount(null);setChainId(null);setNetworkOk(false);}}
    })();
    provider.on?.("accountsChanged",accounts);provider.on?.("chainChanged",chain);
    return()=>{active=false;provider.removeListener?.("accountsChanged",accounts);provider.removeListener?.("chainChanged",chain);};
  },[provider]);

  const value={account,chainId,networkOk,message,provider,connect,switchNetwork,disconnect};
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(){const value=useContext(WalletContext);if(!value)throw new Error("useWallet must be used inside WalletSessionProvider");return value;}

export function WalletBar(){
  const w=useWallet();
  return <div className="walletBar" aria-label="Wallet status">
    <div><span className={`statusPill ${w.account&&w.networkOk?"ok":"warn"}`}>{!w.account?"Wallet disconnected":w.networkOk?"Studionet · 61999":`Wrong network${w.chainId?` · ${w.chainId}`:""}`}</span><span className="mono walletAccount">{w.account?`${w.account.slice(0,8)}…${w.account.slice(-6)}`:"Connect from the navbar to enable transaction actions."}</span></div>
    <span className="walletBarHint">{w.provider?"Wallet controls are in the top navigation.":"No injected wallet is available in this browser."}</span>
  </div>;
}
