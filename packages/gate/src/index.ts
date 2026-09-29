import * as core from "@actions/core";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {TransactionHashVariant} from "genlayer-js/types";
import {checkGate,type Migration,type Authorization} from "./check.js";

type ReadClient={
  readContract:(request:Record<string,unknown>)=>Promise<unknown>;
};

async function main(){
  const address=core.getInput("contract-address",{required:true}) as `0x${string}`;
  const migrationId=Number(core.getInput("migration-id",{required:true}));
  const expected=core.getInput("expected-candidate-ref",{required:true});
  const chainId=Number(core.getInput("chain-id")||"61999");

  if(!Number.isInteger(migrationId)||migrationId<=0)throw new Error("migration-id must be a positive integer");
  if(!/^0x[a-fA-F0-9]{40}$/.test(address))throw new Error("contract-address must be a 20-byte hex address");
  if(!expected)throw new Error("expected-candidate-ref is required");
  if(chainId!==61999)throw new Error("CUTOVER gate only supports Studionet chain 61999");

  const client=createClient({chain:studionet}) as unknown as ReadClient;
  const read=(functionName:string)=>client.readContract({
    address,
    functionName,
    args:[migrationId],
    transactionHashVariant:TransactionHashVariant.LATEST_FINAL,
  });

  const [migrationRaw,authorizationRaw]=await Promise.all([
    read("get_migration"),
    read("get_authorization"),
  ]);

  checkGate(migrationRaw as Migration,authorizationRaw as Authorization,expected);
  core.info(`CUTOVER authorization verified for ${expected}`);
}

main().catch(error=>core.setFailed(error instanceof Error?error.message:String(error)));
