import {beforeEach,describe,expect,it,vi} from "vitest";

const waitForDecision=vi.fn();
const waitForFinalization=vi.fn();
vi.mock("genlayer-js",()=>({
  createClient:()=>({waitForDecision,waitForFinalization}),
  isSuccessful:(x:{ok:boolean})=>x.ok,
}));
vi.mock("genlayer-js/chains",()=>({studionet:{id:61999}}));

import {waitForFinality} from "../lib/tx";

describe("transaction lifecycle",()=>{
  beforeEach(()=>{waitForDecision.mockReset();waitForFinalization.mockReset()});
  it("does not treat ACCEPTED/decision as final completion",async()=>{
    waitForDecision.mockResolvedValue({ok:true,statusName:"ACCEPTED",txExecutionResultName:"SUCCESS"});
    waitForFinalization.mockResolvedValue({ok:true,statusName:"FINALIZED",txExecutionResultName:"SUCCESS"});
    const phases:string[]=[];
    await waitForFinality("0xabc" as `0x${string}`,p=>phases.push(p));
    expect(phases).toEqual(["submitted","accepted","finalizing","finalized","execution_success"]);
    expect(waitForFinalization).toHaveBeenCalledTimes(1);
  });
  it("stops on unsuccessful decision",async()=>{
    waitForDecision.mockResolvedValue({ok:false,statusName:"ACCEPTED",txExecutionResultName:"ERROR"});
    const phases:string[]=[];
    await expect(waitForFinality("0xabc" as `0x${string}`,p=>phases.push(p))).rejects.toThrow("did not execute successfully");
    expect(phases).toEqual(["submitted","accepted","execution_failure"]);
    expect(waitForFinalization).not.toHaveBeenCalled();
  });
  it("reports finalized execution failure separately",async()=>{
    waitForDecision.mockResolvedValue({ok:true,statusName:"ACCEPTED",txExecutionResultName:"SUCCESS"});
    waitForFinalization.mockResolvedValue({ok:false,statusName:"FINALIZED",txExecutionResultName:"ERROR"});
    const phases:string[]=[];
    await expect(waitForFinality("0xabc" as `0x${string}`,p=>phases.push(p))).rejects.toThrow("finalized with execution failure");
    expect(phases).toEqual(["submitted","accepted","finalizing","finalized","execution_failure"]);
  });
});
