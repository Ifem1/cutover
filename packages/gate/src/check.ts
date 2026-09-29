export type Migration={state:string;candidate_generation:number;candidate_ref:string;candidate_manifest_digest:string;assessed_generation:number};
export type Authorization={candidate_generation:number;candidate_ref:string;candidate_manifest_digest:string;evidence_root:string;authorization_digest:string};
const sha=(v:string)=>/^[a-f0-9]{64}$/i.test(v);
export function checkGate(m:Migration,a:Authorization,expected:string){
 if(m.state!=="AUTHORIZED")throw new Error(`CUTOVER state is ${m.state}, expected AUTHORIZED`);
 if(a.candidate_generation!==m.candidate_generation)throw new Error("authorization generation is stale");
 if(m.assessed_generation!==m.candidate_generation)throw new Error("assessment generation is stale");
 if(a.candidate_ref!==m.candidate_ref)throw new Error("authorization ref does not match current candidate");
 if(a.candidate_ref!==expected)throw new Error(`authorized candidate ref ${a.candidate_ref} does not equal expected ${expected}`);
 if(!sha(m.candidate_manifest_digest)||a.candidate_manifest_digest!==m.candidate_manifest_digest)throw new Error("authorization manifest digest does not match current candidate manifest");
 if(!sha(a.evidence_root))throw new Error("authorization evidence root is missing or malformed");
 if(!sha(a.authorization_digest))throw new Error("authorization digest is missing or malformed");
 return true;
}
