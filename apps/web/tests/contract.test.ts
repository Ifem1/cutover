import {beforeEach,describe,expect,it,vi} from "vitest";

const {createClient,writeContract,connect,estimateTransactionFeesForWrite}=vi.hoisted(()=>({
  createClient:vi.fn(),
  writeContract:vi.fn(),
  connect:vi.fn(),
  estimateTransactionFeesForWrite:vi.fn(),
}));

vi.mock("genlayer-js",()=>({createClient}));
vi.mock("genlayer-js/chains",()=>({studionet:{id:61999,name:"studionet"}}));
vi.mock("genlayer-js/types",()=>({TransactionHashVariant:{LATEST_FINAL:"latest-final"}}));
vi.mock("../lib/config",()=>({
  CONTRACT_ADDRESS:"0x2222222222222222222222222222222222222222",
  isConfigured:()=>true,
}));

import {writeCutover} from "../lib/contract";

const ACCOUNT="0x1111111111111111111111111111111111111111" as `0x${string}`;
const HASH=("0x"+"a".repeat(64)) as `0x${string}`;

describe("provider-backed contract writes",()=>{
  beforeEach(()=>{
    createClient.mockReset();writeContract.mockReset();connect.mockReset();estimateTransactionFeesForWrite.mockReset();
    createClient.mockReturnValue({writeContract,connect,estimateTransactionFeesForWrite});
    writeContract.mockResolvedValue(HASH);
  });

  it("uses the selected EIP-1193 provider directly without legacy connect or unavailable fee helpers",async()=>{
    const provider={request:vi.fn()};
    const result=await writeCutover(ACCOUNT,provider,"create_migration",["QA","https://example.com",300]);

    expect(result).toBe(HASH);
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({account:ACCOUNT,provider}));
    expect(connect).not.toHaveBeenCalled();
    expect(estimateTransactionFeesForWrite).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledWith({
      address:"0x2222222222222222222222222222222222222222",
      functionName:"create_migration",
      args:["QA","https://example.com",300],
      value:0n,
    });
  });
});
