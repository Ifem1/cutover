import {describe,it,expect} from "vitest";
import surface from "../../../contracts/surface.json";
import {WRITE_EXAMPLES,WRITE_METHODS,writeArityIsValid} from "../lib/surface";

describe("contract schema parity",()=>{
  it("exposes every public write",()=>{
    expect(new Set(WRITE_METHODS)).toEqual(new Set(Object.keys(surface.writes)));
  });
  it("keeps every example at exact contract arity",()=>{
    for(const [name,args] of Object.entries(WRITE_EXAMPLES)){
      expect(writeArityIsValid(name,args),name).toBe(true);
    }
  });
  it("has no hidden write example",()=>{
    expect(Object.keys(WRITE_EXAMPLES).sort()).toEqual(Object.keys(surface.writes).sort());
  });
  it("authorization and derivation take no caller timestamp",()=>{
    expect(surface.writes.derive_candidate).toEqual(["migration_id"]);
    expect(surface.writes.authorize).toEqual(["migration_id"]);
  });
});
