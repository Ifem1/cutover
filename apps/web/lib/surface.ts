import surface from "../../../contracts/surface.json";

export const WRITE_EXAMPLES:Record<string,unknown[]>={
  create_migration:["Site migration","https://old.example.com",3600],
  add_route:[1,"pricing","https://old.example.com/pricing","/pricing",JSON.stringify([{id:"pricing",question:"Is the published monthly commitment preserved?",allowed_changes:"Cosmetic layout and copy edits only."}])],
  freeze_route:[1,"pricing","https://proof.example/baseline.json","{}","sha256"],
  seal_baseline:[1],
  set_candidate:[1,"https://candidate.example.com","git-commit-or-deployment-ref"],
  assess_route:[1,"pricing"],
  derive_candidate:[1],
  open_challenge:[1,"pricing","https://proof.example/challenge","bounded challenge evidence"],
  reassess_challenge:[1],
  authorize:[1],
  cancel_migration:[1],
};

export const WRITE_METHODS=Object.keys(surface.writes);

export function writeArityIsValid(name:string,args:unknown[]){
  const expected=(surface.writes as Record<string,string[]>)[name];
  return Array.isArray(expected)&&args.length===expected.length;
}
