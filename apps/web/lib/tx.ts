import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {ExecutionResult,TransactionStatus,type TransactionHash} from "genlayer-js/types";

export type TxPhase=
  |"awaiting_signature"
  |"submitted"
  |"accepted"
  |"decision_failure"
  |"finalizing"
  |"finalized"
  |"execution_success"
  |"execution_failure";

export const readClient=createClient({chain:studionet});

export async function waitForFinality(hash:TransactionHash,onPhase:(phase:TxPhase)=>void){
  onPhase("submitted");

  // In genlayer-js 1.1.8, waiting for ACCEPTED returns once the transaction
  // reaches any decided state. Check that state explicitly before proceeding.
  const decided=await readClient.waitForTransactionReceipt({
    hash,
    status:TransactionStatus.ACCEPTED,
  });

  if(decided.statusName!==TransactionStatus.ACCEPTED&&decided.statusName!==TransactionStatus.FINALIZED){
    onPhase("decision_failure");
    throw new Error(`GenLayer decision did not accept the transaction: ${decided.statusName??"UNKNOWN"}`);
  }

  onPhase("accepted");
  onPhase("finalizing");

  const finalized=decided.statusName===TransactionStatus.FINALIZED
    ? decided
    : await readClient.waitForTransactionReceipt({
        hash,
        status:TransactionStatus.FINALIZED,
      });

  onPhase("finalized");

  if(finalized.txExecutionResultName===ExecutionResult.FINISHED_WITH_ERROR){
    onPhase("execution_failure");
    throw new Error("GenLayer transaction finalized, but contract execution failed.");
  }
  if(finalized.txExecutionResultName!==ExecutionResult.FINISHED_WITH_RETURN){
    onPhase("execution_failure");
    throw new Error(`GenLayer transaction finalized without a successful execution result: ${finalized.txExecutionResultName??"UNKNOWN"}`);
  }

  onPhase("execution_success");
  return finalized;
}
