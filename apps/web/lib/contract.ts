import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionHashVariant} from "genlayer-js/types";
import {CONTRACT_ADDRESS,isConfigured} from "./config";

export type Eip1193Provider={
  request:(args:{method:string;params?:unknown[]})=>Promise<unknown>;
  on?:(event:"accountsChanged"|"chainChanged",listener:(value:unknown)=>void)=>void;
  removeListener?:(event:"accountsChanged"|"chainChanged",listener:(value:unknown)=>void)=>void;
};

type ContractWrite={address:`0x${string}`;functionName:string;args:unknown[];value:bigint};
type ReadClient={readContract:(request:Record<string,unknown>)=>Promise<unknown>};
type WriteClient={writeContract:(request:ContractWrite)=>Promise<`0x${string}`>};

export async function readCutover(functionName:string,args:unknown[]=[]):Promise<unknown>{
  if(!isConfigured())throw new Error("CUTOVER contract not configured");
  const client=createClient({chain:studionet}) as unknown as ReadClient;
  return client.readContract({address:CONTRACT_ADDRESS as `0x${string}`,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
}

export async function writeCutover(account:`0x${string}`,provider:Eip1193Provider,functionName:string,args:unknown[]=[]):Promise<`0x${string}`>{
  if(!isConfigured())throw new Error("CUTOVER contract not configured");

  // genlayer-js@1.1.8 already routes eth_sendTransaction through the supplied
  // EIP-1193 provider. Network switching is owned by WalletSession so this path
  // never calls client.connect(), which in 1.1.8 uses global window.ethereum
  // and the legacy MetaMask Snap flow instead of the selected provider.
  //
  // The stable 1.1.8 client also does not expose estimateTransactionFeesForWrite;
  // writeContract performs the supported Studionet submission directly.
  const client=createClient({chain:studionet,account,provider} as never) as unknown as WriteClient;
  return client.writeContract({
    address:CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    value:0n,
  });
}
