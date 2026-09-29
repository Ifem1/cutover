import {createClient,isSuccessful} from "genlayer-js";
import {studionet} from "genlayer-js/chains";

export type TxPhase="awaiting_signature"|"submitted"|"accepted"|"finalizing"|"finalized"|"execution_success"|"execution_failure";
export const readClient=createClient({chain:studionet});

export async function waitForFinality(hash:`0x${string}`,onPhase:(p:TxPhase)=>void){
  onPhase("submitted");
  const decided:any=await readClient.waitForDecision({hash,fullTransaction:true});
  onPhase("accepted");
  if(!isSuccessful(decided)){
    onPhase("execution_failure");
    throw new Error(`GenLayer decision did not execute successfully: ${decided.statusName} / ${decided.txExecutionResultName}`);
  }
  onPhase("finalizing");
  const finalized:any=await readClient.waitForFinalization({hash,fullTransaction:true});
  onPhase("finalized");
  if(!isSuccessful(finalized)){
    onPhase("execution_failure");
    throw new Error(`GenLayer transaction finalized with execution failure: ${finalized.statusName} / ${finalized.txExecutionResultName}`);
  }
  onPhase("execution_success");
  return finalized;
}
