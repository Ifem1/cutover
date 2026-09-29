import {describe,it,expect} from "vitest";
import {assessmentCanRun,canonicalJson,isSafeCandidatePath,manifestUrlForOrigin,reviewProgress} from "../lib/workflow";
describe("workflow helpers",()=>{
 it("builds same-origin well-known manifest URL",()=>expect(manifestUrlForOrigin("https://candidate.example/" )).toBe("https://candidate.example/.well-known/cutover.json"));
 for(const path of ["/pricing","/legal/terms","/"])it(`accepts safe path ${path}`,()=>expect(isSafeCandidatePath(path)).toBe(true));
 for(const path of ["https://evil.example/x","//evil.example/x","/../secret","/pricing?x=1","pricing"])it(`rejects unsafe path ${path}`,()=>expect(isSafeCandidatePath(path)).toBe(false));
 it("allows first assessment",()=>expect(assessmentCanRun("CANDIDATE",undefined,0)).toBe(true));
 it("allows bounded inconclusive retry",()=>expect(assessmentCanRun("INCONCLUSIVE","INCONCLUSIVE",2)).toBe(true));
 it("locks READY and BLOCKED",()=>{expect(assessmentCanRun("CANDIDATE","READY",1)).toBe(false);expect(assessmentCanRun("INCONCLUSIVE","BLOCKED",1)).toBe(false)});
 it("caps ordinary attempts at three",()=>expect(assessmentCanRun("INCONCLUSIVE","INCONCLUSIVE",3)).toBe(false));
 it("review progress clamps",()=>{expect(reviewProgress(50,100,200)).toBe(0);expect(reviewProgress(150,100,200)).toBe(.5);expect(reviewProgress(250,100,200)).toBe(1)});
 it("canonical JSON recursively sorts object keys",()=>expect(canonicalJson({z:1,a:{y:2,b:3}})).toBe('{"a":{"b":3,"y":2},"z":1}'));
});
