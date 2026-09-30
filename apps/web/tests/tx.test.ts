import {beforeEach,describe,expect,it,vi} from "vitest";
import {ExecutionResult,TransactionStatus} from "genlayer-js/types";

const {getTransaction}=vi.hoisted(()=>({getTransaction:vi.fn()}));
vi.mock("genlayer-js",()=>({createClient:()=>({getTransaction})}));
vi.mock("genlayer-js/chains",()=>({studionet:{id:61999}}));

import {clearPendingTransaction,loadPendingTransaction,savePendingTransaction,waitForFinality} from "../lib/tx";

const HASH=("0x"+"a".repeat(64)) as `0x${string}`;
const tx=(statusName:TransactionStatus,txExecutionResultName?:ExecutionResult)=>({statusName,txExecutionResultName});
const immediate={timeoutMs:1000,pollIntervalMs:0,sleep:async()=>{}};

describe("transaction lifecycle",()=>{
  beforeEach(()=>getTransaction.mockReset());

  it("keeps PENDING, consensus, ACCEPTED, FINALIZED, and execution success distinct",async()=>{
    getTransaction
      .mockResolvedValueOnce(tx(TransactionStatus.PENDING))
      .mockResolvedValueOnce(tx(TransactionStatus.PROPOSING))
      .mockResolvedValueOnce(tx(TransactionStatus.ACCEPTED))
      .mockResolvedValueOnce(tx(TransactionStatus.ACCEPTED))
      .mockResolvedValueOnce(tx(TransactionStatus.FINALIZED,ExecutionResult.FINISHED_WITH_RETURN));

    const phases:string[]=[];
    await waitForFinality(HASH,phase=>phases.push(phase),immediate);

    expect(phases).toEqual(["submitted","pending","consensus_processing","accepted","finalizing","finalized","execution_success"]);
    expect(getTransaction).toHaveBeenCalledTimes(5);
    expect(getTransaction.mock.calls[0][0].hash).toBe(HASH);
  });

  it("stops when consensus reaches a non-accepted decided state",async()=>{
    getTransaction.mockResolvedValueOnce(tx(TransactionStatus.UNDETERMINED,ExecutionResult.NOT_VOTED));
    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase),immediate)).rejects.toThrow("did not accept");
    expect(phases).toEqual(["submitted","decision_failure"]);
    expect(getTransaction).toHaveBeenCalledTimes(1);
  });

  it("reports finalized execution failure separately",async()=>{
    getTransaction.mockResolvedValueOnce(tx(TransactionStatus.FINALIZED,ExecutionResult.FINISHED_WITH_ERROR));
    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase),immediate)).rejects.toThrow("contract execution failed");
    expect(phases).toEqual(["submitted","accepted","finalizing","finalized","execution_failure"]);
  });

  it("preserves a retryable RPC error and exposes its phase",async()=>{
    getTransaction.mockRejectedValueOnce(new Error("endpoint unavailable"));
    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase),immediate)).rejects.toMatchObject({phase:"rpc_error",hash:HASH});
    expect(phases).toEqual(["submitted","rpc_error"]);
  });

  it("preserves a pending hash when status tracking times out",async()=>{
    getTransaction.mockResolvedValue(tx(TransactionStatus.PENDING));
    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase),{...immediate,timeoutMs:0})).rejects.toMatchObject({phase:"timeout",hash:HASH});
    expect(phases).toEqual(["submitted","pending","timeout"]);
  });

  it("rejects malformed transaction hashes before polling",async()=>{
    const phases:string[]=[];
    await expect(waitForFinality("0xabc" as `0x${string}`,phase=>phases.push(phase),immediate)).rejects.toThrow("Invalid GenLayer transaction hash");
    expect(phases).toEqual([]);
    expect(getTransaction).not.toHaveBeenCalled();
  });

  it("restores a submitted hash from session storage after page refresh",()=>{
    const pending={hash:HASH,method:"authorize",migrationId:3,submittedAt:1234};
    savePendingTransaction(pending);
    expect(loadPendingTransaction()).toEqual(pending);
    clearPendingTransaction(HASH);
    expect(loadPendingTransaction()).toBeNull();
  });
});
