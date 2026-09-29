import * as core from "@actions/core";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionHashVariant} from "genlayer-js/types";
import {checkGate} from "./check.js";

async function main(){
  const address=core.getInput("contract-address",{required:true}) as `0x${string}`;
  const migrationId=Number(core.getInput("migration-id",{required:true}));
  const expected=core.getInput("expected-candidate-ref",{required:true});
  const chainId=Number(core.getInput("chain-id")||"61999");
  if(chainId!==61999) throw new Error("CUTOVER gate only supports Studionet chain 61999");
  const client:any=createClient({chain:studionet});
  const read=(functionName:string)=>client.readContract({
    address,functionName,args:[migrationId],
    transactionHashVariant:TransactionHashVariant.LATEST_FINAL
  });
  const [m,a]=await Promise.all([read("get_migration"),read("get_authorization")]);
  checkGate(m,a,expected);
  core.info(`CUTOVER authorization verified for ${expected}`);
}
main().catch(e=>core.setFailed(e instanceof Error?e.message:String(e)));
