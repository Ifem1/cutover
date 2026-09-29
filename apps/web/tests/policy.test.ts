import {describe,it,expect} from "vitest";
import {actionPolicy} from "../lib/policy";
const base={state:"READY" as const,isOwner:true,baselineSealed:true,candidateGeneration:2,assessedGeneration:2,challengeOpen:false,challengeUsedGeneration:1,reviewDeadline:100,now:101,authorized:false,networkOk:true};
describe("action policy",()=>{
  it("allows authorize only after deadline",()=>expect(actionPolicy(base).authorize).toBe(true));
  it("blocks authorize before deadline",()=>expect(actionPolicy({...base,now:99}).authorize).toBe(false));
  it("blocks authorize during challenge",()=>expect(actionPolicy({...base,challengeOpen:true}).authorize).toBe(false));
  it("blocks stale generation",()=>expect(actionPolicy({...base,assessedGeneration:1}).authorize).toBe(false));
  it("blocks wrong network",()=>expect(actionPolicy({...base,networkOk:false}).authorize).toBe(false));
  it("does not treat READY as authorized",()=>expect(base.authorized).toBe(false));
  it("challenge exists only inside the review window",()=>expect(actionPolicy({...base,now:99}).challenge).toBe(true));
  it("blocks challenge at deadline",()=>expect(actionPolicy({...base,now:100}).challenge).toBe(false));
  it("blocks second challenge for a generation",()=>expect(actionPolicy({...base,now:99,challengeUsedGeneration:2}).challenge).toBe(false));
  it("blocks challenge while another is open",()=>expect(actionPolicy({...base,now:99,challengeOpen:true}).challenge).toBe(false));
  it("owner-only actions reject non-owner",()=>{
    const p=actionPolicy({...base,state:"DRAFT",isOwner:false,baselineSealed:false});
    expect(p.addRoute).toBe(false); expect(p.sealBaseline).toBe(false); expect(p.cancel).toBe(false);
  });
  it("assessment requires a candidate generation",()=>expect(actionPolicy({...base,state:"CANDIDATE",candidateGeneration:0}).assess).toBe(false));
});
