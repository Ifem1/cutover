import {beforeEach,describe,expect,it,vi} from "vitest";
import {ExecutionResult,TransactionStatus} from "genlayer-js/types";

const waitForTransactionReceipt=vi.fn();
vi.mock("genlayer-js",()=>({
  createClient:()=>({waitForTransactionReceipt}),
}));
vi.mock("genlayer-js/chains",()=>({studionet:{id:61999}}));

import {waitForFinality} from "../lib/tx";

const HASH=(`0x${"a".repeat(64)}`) as `0x${string}`;

describe("transaction lifecycle",()=>{
  beforeEach(()=>waitForTransactionReceipt.mockReset());

  it("does not treat ACCEPTED as final completion",async()=>{
    waitForTransactionReceipt
      .mockResolvedValueOnce({
        statusName:TransactionStatus.ACCEPTED,
        txExecutionResultName:ExecutionResult.FINISHED_WITH_RETURN,
      })
      .mockResolvedValueOnce({
        statusName:TransactionStatus.FINALIZED,
        txExecutionResultName:ExecutionResult.FINISHED_WITH_RETURN,
      });

    const phases:string[]=[];
    await waitForFinality(HASH,phase=>phases.push(phase));

    expect(phases).toEqual(["submitted","accepted","finalizing","finalized","execution_success"]);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2);
    expect(waitForTransactionReceipt.mock.calls[0][0].status).toBe(TransactionStatus.ACCEPTED);
    expect(waitForTransactionReceipt.mock.calls[1][0].status).toBe(TransactionStatus.FINALIZED);
  });

  it("stops when consensus reaches a non-accepted decided state",async()=>{
    waitForTransactionReceipt.mockResolvedValueOnce({
      statusName:TransactionStatus.UNDETERMINED,
      txExecutionResultName:ExecutionResult.NOT_VOTED,
    });

    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase))).rejects.toThrow("did not accept");
    expect(phases).toEqual(["submitted","decision_failure"]);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it("reports finalized execution failure separately",async()=>{
    waitForTransactionReceipt
      .mockResolvedValueOnce({
        statusName:TransactionStatus.ACCEPTED,
        txExecutionResultName:ExecutionResult.FINISHED_WITH_RETURN,
      })
      .mockResolvedValueOnce({
        statusName:TransactionStatus.FINALIZED,
        txExecutionResultName:ExecutionResult.FINISHED_WITH_ERROR,
      });

    const phases:string[]=[];
    await expect(waitForFinality(HASH,phase=>phases.push(phase))).rejects.toThrow("contract execution failed");
    expect(phases).toEqual(["submitted","accepted","finalizing","finalized","execution_failure"]);
  });

  it("rejects malformed transaction hashes before polling",async()=>{
    const phases:string[]=[];
    await expect(waitForFinality("0xabc" as `0x${string}`,phase=>phases.push(phase))).rejects.toThrow("Invalid GenLayer transaction hash");
    expect(phases).toEqual([]);
    expect(waitForTransactionReceipt).not.toHaveBeenCalled();
  });
});
