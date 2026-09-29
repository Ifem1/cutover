import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionHashVariant} from "genlayer-js/types";
import {CONTRACT_ADDRESS,isConfigured} from "./config";

export async function readCutover(functionName:string,args:unknown[]=[]){
  if(!isConfigured()) throw new Error("CUTOVER contract not configured");
  const c:any=createClient({chain:studionet});
  return c.readContract({address:CONTRACT_ADDRESS as `0x${string}`,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
}
export async function writeCutover(account:`0x${string}`,provider:any,functionName:string,args:unknown[]=[]){
  if(!isConfigured()) throw new Error("CUTOVER contract not configured");
  const c:any=createClient({chain:studionet,account,provider});
  await c.connect("studionet");
  const write={address:CONTRACT_ADDRESS as `0x${string}`,functionName,args,value:0n};
  const estimate=await c.estimateTransactionFeesForWrite(write);
  return c.writeContract({...write,fees:{distribution:estimate.distribution,feeValue:estimate.feeValue}});
}
