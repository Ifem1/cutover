import {describe,expect,it} from "vitest";
import {checkGate} from "../src/check.js";
const H="a".repeat(64),D="b".repeat(64),A="c".repeat(64);
const m={state:"AUTHORIZED",candidate_generation:3,candidate_ref:"release-42",candidate_manifest_digest:H,assessed_generation:3};
const a={candidate_generation:3,candidate_ref:"release-42",candidate_manifest_digest:H,evidence_root:D,authorization_digest:A};
describe("CUTOVER gate",()=>{
 it("accepts the exact authorized ref and evidence provenance",()=>expect(checkGate(m,a,"release-42")).toBe(true));
 it("rejects wrong expected ref",()=>expect(()=>checkGate(m,a,"other")).toThrow(/expected/));
 it("rejects stale generation",()=>expect(()=>checkGate({...m,candidate_generation:4},a,"release-42")).toThrow(/generation/));
 it("rejects non-authorized state",()=>expect(()=>checkGate({...m,state:"READY"},a,"release-42")).toThrow(/AUTHORIZED/));
 it("rejects manifest substitution",()=>expect(()=>checkGate(m,{...a,candidate_manifest_digest:"d".repeat(64)},"release-42")).toThrow(/manifest/));
 it("rejects missing evidence root",()=>expect(()=>checkGate(m,{...a,evidence_root:""},"release-42")).toThrow(/evidence root/));
 it("rejects malformed authorization digest",()=>expect(()=>checkGate(m,{...a,authorization_digest:"not-a-digest"},"release-42")).toThrow(/authorization digest/));
});
