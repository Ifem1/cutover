import {NotConfigured} from "@/components/NotConfigured";
import {NETWORK,isConfigured} from "@/lib/config";
import {readCutover} from "@/lib/contract";

export const dynamic="force-dynamic";

type MigrationRecord={
  state:string;
  candidate_generation:number;
  candidate_ref:string;
  assessed_generation:number;
};
type AuthorizationRecord={
  candidate_generation?:number;
  candidate_ref?:string;
  authorization_digest?:string;
};

export default async function Page({searchParams}:{searchParams:Promise<{migrationId?:string;expectedRef?:string}>}){
  const params=await searchParams;
  const migrationId=Number(params.migrationId||"");
  const expectedRef=(params.expectedRef||"").trim();

  let verification:React.ReactNode=null;
  if(isConfigured()&&Number.isInteger(migrationId)&&migrationId>0){
    try{
      const [migration,authorization]=await Promise.all([
        readCutover("get_migration",[migrationId]) as Promise<MigrationRecord>,
        readCutover("get_authorization",[migrationId]) as Promise<AuthorizationRecord>,
      ]);
      const exactAuthorized=
        migration.state==="AUTHORIZED"&&
        authorization.candidate_generation===migration.candidate_generation&&
        authorization.candidate_ref===migration.candidate_ref;
      const expectedMatches=expectedRef?authorization.candidate_ref===expectedRef:null;
      verification=<div className="panel section">
        <h2>Finalized authorization check</h2>
        <p><b>Migration state:</b> <span className="status">{migration.state}</span></p>
        <p><b>Current generation:</b> {migration.candidate_generation}</p>
        <p><b>Assessed generation:</b> {migration.assessed_generation}</p>
        <p><b>Current candidate ref:</b> <span className="mono">{migration.candidate_ref||"None"}</span></p>
        <p><b>Authorized generation:</b> {authorization.candidate_generation??"None"}</p>
        <p><b>Authorized ref:</b> <span className="mono">{authorization.candidate_ref||"None"}</span></p>
        <p><b>Authorization digest:</b> <span className="mono">{authorization.authorization_digest||"None"}</span></p>
        <p><b>Exact current authorization:</b> {exactAuthorized?"PASS":"FAIL"}</p>
        {expectedRef&&<p><b>Expected ref match:</b> {expectedMatches?"PASS":"FAIL"}</p>}
      </div>;
    }catch(error){
      verification=<div className="notice section">Verification read failed: {error instanceof Error?error.message:String(error)}</div>;
    }
  }

  return <main className="wrap section">
    <div className="eyebrow">Independent verification</div>
    <h1>Verify a release authorization</h1>
    <div className="panel">
      <b>Network</b><p>{NETWORK.name} · chain {NETWORK.chainId}</p>
      <b>RPC</b><p className="mono">{NETWORK.rpc}</p>
      <b>Explorer</b><p className="mono">{NETWORK.explorer}</p>
    </div>

    {!isConfigured()?<div className="section"><NotConfigured/></div>:<form method="get" action="/verify" className="panel section">
      <h2>Read finalized contract state</h2>
      <label>Migration ID<br/><input name="migrationId" defaultValue={params.migrationId||""} inputMode="numeric" required style={{width:"100%",padding:12,marginTop:6}}/></label>
      <br/><br/>
      <label>Expected candidate ref (optional)<br/><input name="expectedRef" defaultValue={expectedRef} placeholder="git SHA or immutable deployment ref" style={{width:"100%",padding:12,marginTop:6}}/></label>
      <p><button className="button hot" type="submit">Verify</button></p>
    </form>}

    {verification}
  </main>;
}
