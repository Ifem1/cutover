import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {ExecutionResult,TransactionStatus,type GenLayerTransaction,type TransactionHash} from "genlayer-js/types";

export type TxPhase=
  |"awaiting_signature"
  |"signature_rejected"
  |"submission_error"
  |"submitted"
  |"pending"
  |"consensus_processing"
  |"accepted"
  |"decision_failure"
  |"finalizing"
  |"finalized"
  |"execution_success"
  |"execution_failure"
  |"rpc_error"
  |"timeout";

export type PendingCutoverTransaction={
  hash:`0x${string}`;
  method:string;
  migrationId?:number;
  submittedAt:number;
};

const PENDING_TX_KEY="cutover.pendingTransaction.v1";
const DEFAULT_TIMEOUT_MS=5*60*1000;
const DEFAULT_POLL_INTERVAL_MS=3000;

export const readClient=createClient({chain:studionet});

function toTransactionHash(hash:`0x${string}`):TransactionHash{
  if(!/^0x[a-fA-F0-9]{64}$/.test(hash)){
    throw new Error("Invalid GenLayer transaction hash");
  }
  return hash as TransactionHash;
}

export function loadPendingTransaction():PendingCutoverTransaction|null{
  if(typeof window==="undefined")return null;
  try{
    const value=JSON.parse(window.sessionStorage.getItem(PENDING_TX_KEY)??"null");
    if(!value||typeof value.hash!=="string"||!/^0x[a-fA-F0-9]{64}$/.test(value.hash)||typeof value.method!=="string")return null;
    return {hash:value.hash,method:value.method,migrationId:Number.isInteger(value.migrationId)?value.migrationId:undefined,submittedAt:Number.isFinite(value.submittedAt)?value.submittedAt:Date.now()};
  }catch{return null;}
}

export function savePendingTransaction(value:PendingCutoverTransaction):boolean{
  if(typeof window==="undefined")return false;
  try{window.sessionStorage.setItem(PENDING_TX_KEY,JSON.stringify(value));return true;}catch{return false;}
}

export function clearPendingTransaction(hash?:`0x${string}`):void{
  if(typeof window==="undefined")return;
  const current=loadPendingTransaction();
  if(!hash||current?.hash===hash)try{window.sessionStorage.removeItem(PENDING_TX_KEY);}catch{/* leave recovery available if storage is unavailable */}
}

export class TxTrackingError extends Error{
  constructor(readonly phase:"rpc_error"|"timeout",readonly hash:`0x${string}`,message:string){super(message);this.name="TxTrackingError";}
}

export class TxExecutionError extends Error{
  constructor(message:string,readonly transaction:GenLayerTransaction){super(message);this.name="TxExecutionError";}
}

type WaitOptions={timeoutMs?:number;pollIntervalMs?:number;sleep?:(ms:number)=>Promise<void>};
type TransactionReader={getTransaction:(args:{hash:TransactionHash})=>Promise<GenLayerTransaction>};

const sleep=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

function emit(onPhase:(phase:TxPhase)=>void,last:{phase:TxPhase|null},phase:TxPhase){
  if(last.phase!==phase){last.phase=phase;onPhase(phase);}
}

export async function waitForFinality(
  hash:`0x${string}`,
  onPhase:(phase:TxPhase)=>void,
  options:WaitOptions={},
){
  const txHash=toTransactionHash(hash);
  const timeoutMs=options.timeoutMs??DEFAULT_TIMEOUT_MS;
  const pollIntervalMs=options.pollIntervalMs??DEFAULT_POLL_INTERVAL_MS;
  const pause=options.sleep??sleep;
  const reader=readClient as unknown as TransactionReader;
  const deadline=Date.now()+timeoutMs;
  const last={phase:null as TxPhase|null};
  let accepted=false;
  let firstPoll=true;
  emit(onPhase,last,"submitted");

  while(firstPoll||Date.now()<=deadline){
    firstPoll=false;
    let transaction:GenLayerTransaction;
    try{
      transaction=await reader.getTransaction({hash:txHash});
    }catch(error){
      const detail=error instanceof Error?error.message:String(error);
      emit(onPhase,last,"rpc_error");
      throw new TxTrackingError("rpc_error",hash,`Could not read Studionet transaction status. Retry tracking with ${hash}. ${detail}`);
    }

    const status=transaction.statusName;
    if(status===TransactionStatus.PENDING||status===TransactionStatus.UNINITIALIZED){
      emit(onPhase,last,"pending");
    }else if(status===TransactionStatus.PROPOSING||status===TransactionStatus.COMMITTING||status===TransactionStatus.REVEALING||status===TransactionStatus.APPEAL_COMMITTING||status===TransactionStatus.APPEAL_REVEALING){
      emit(onPhase,last,"consensus_processing");
    }else if(status===TransactionStatus.ACCEPTED||status===TransactionStatus.READY_TO_FINALIZE){
      if(!accepted){accepted=true;emit(onPhase,last,"accepted");}
      emit(onPhase,last,"finalizing");
    }else if(status===TransactionStatus.FINALIZED){
      if(!accepted){accepted=true;emit(onPhase,last,"accepted");}
      emit(onPhase,last,"finalizing");
      emit(onPhase,last,"finalized");
      if(transaction.txExecutionResultName===ExecutionResult.FINISHED_WITH_ERROR){
        emit(onPhase,last,"execution_failure");
        throw new TxExecutionError("GenLayer transaction finalized, but contract execution failed.",transaction);
      }
      if(transaction.txExecutionResultName!==ExecutionResult.FINISHED_WITH_RETURN){
        emit(onPhase,last,"execution_failure");
        throw new TxExecutionError(`GenLayer transaction finalized without a successful execution result: ${transaction.txExecutionResultName??"UNKNOWN"}`,transaction);
      }
      emit(onPhase,last,"execution_success");
      return transaction;
    }else if(status===TransactionStatus.UNDETERMINED||status===TransactionStatus.CANCELED||status===TransactionStatus.VALIDATORS_TIMEOUT||status===TransactionStatus.LEADER_TIMEOUT){
      emit(onPhase,last,"decision_failure");
      throw new Error(`GenLayer decision did not accept the transaction: ${status}`);
    }else{
      emit(onPhase,last,accepted?"finalizing":"pending");
    }

    const remaining=deadline-Date.now();
    if(remaining<=0)break;
    await pause(Math.min(pollIntervalMs,remaining));
  }

  emit(onPhase,last,"timeout");
  throw new TxTrackingError("timeout",hash,`Timed out while tracking ${hash}; the transaction may still be processing. Retry status tracking.`);
}
