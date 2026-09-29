import {NotConfigured} from "@/components/NotConfigured";
import {isConfigured} from "@/lib/config";
import {readCutover} from "@/lib/contract";

export const dynamic="force-dynamic";

type Rule={id:string;question:string;allowed_changes:string};
type RouteRecord={
  route_id:string;
  baseline_url:string;
  candidate_path:string;
  rules:Rule[];
  baseline_snapshot_url:string;
  baseline_digest:string;
  baseline_frozen:boolean;
  baseline_snapshot:string;
  baseline_observation:string;
};
type MigrationRecord={candidate_generation:number;candidate_origin:string;candidate_ref:string};
type Finding={rule_id:string;status:string;reason:string};
type AssessmentRecord={
  generation?:number;
  route_id?:string;
  candidate_ref?:string;
  baseline_digest?:string;
  evidence_available?:boolean;
  observation?:Record<string,unknown>;
  findings?:Finding[];
  route_result?:string;
  assessment_digest?:string;
};

function pretty(value:unknown){return JSON.stringify(value,null,2)}

export default async function Page({params}:{params:Promise<{id:string,routeId:string}>}){
  const {id,routeId}=await params;
  const migrationId=Number(id);

  if(!isConfigured()){
    return <main className="wrap section">
      <div className="eyebrow">Evidence · {id} / {routeId}</div>
      <h1>Route evidence</h1>
      <NotConfigured/>
    </main>;
  }

  if(!Number.isInteger(migrationId)||migrationId<=0){
    return <main className="wrap section"><h1>Invalid migration ID</h1></main>;
  }

  try{
    const [migration,route]=await Promise.all([
      readCutover("get_migration",[migrationId]) as Promise<MigrationRecord>,
      readCutover("get_route",[migrationId,routeId]) as Promise<RouteRecord>,
    ]);
    const assessment=migration.candidate_generation>0
      ? await readCutover("get_route_assessment",[migrationId,migration.candidate_generation,routeId]) as AssessmentRecord
      : {} as AssessmentRecord;
    const snapshot=route.baseline_snapshot?JSON.parse(route.baseline_snapshot) as unknown:{};
    const baselineObservation=route.baseline_observation?JSON.parse(route.baseline_observation) as unknown:{};
    const candidateUrl=/^https?:\/\//.test(route.candidate_path)
      ? route.candidate_path
      : migration.candidate_origin+route.candidate_path;

    return <main className="wrap section">
      <div className="eyebrow">Evidence · {id} / {routeId}</div>
      <h1>Route evidence</h1>
      <p className="muted">Finalized evidence bindings for candidate generation {migration.candidate_generation}. Candidate ref: <span className="mono">{migration.candidate_ref||"Not set"}</span>.</p>

      <div className="two section">
        <div className="panel">
          <h2>Frozen baseline</h2>
          <p><b>Source:</b> <span className="mono">{route.baseline_url}</span></p>
          <p><b>Snapshot artifact:</b> <span className="mono">{route.baseline_snapshot_url||"None"}</span></p>
          <p><b>SHA-256:</b> <span className="mono">{route.baseline_digest||"None"}</span></p>
          <p><b>Frozen:</b> {route.baseline_frozen?"Yes":"No"}</p>
          <details><summary>Bounded snapshot</summary><pre className="mono" style={{whiteSpace:"pre-wrap"}}>{pretty(snapshot)}</pre></details>
          <details><summary>Authentication result</summary><pre className="mono" style={{whiteSpace:"pre-wrap"}}>{pretty(baselineObservation)}</pre></details>
        </div>

        <div className="panel">
          <h2>Candidate assessment</h2>
          <p><b>Destination:</b> <span className="mono">{candidateUrl||"Not set"}</span></p>
          <p><b>Result:</b> <span className="status">{assessment.route_result||"NOT ASSESSED"}</span></p>
          <p><b>Evidence available:</b> {typeof assessment.evidence_available==="boolean"?(assessment.evidence_available?"Yes":"No"):"N/A"}</p>
          <p><b>Assessment digest:</b> <span className="mono">{assessment.assessment_digest||"None"}</span></p>
          <details><summary>Independent candidate observation</summary><pre className="mono" style={{whiteSpace:"pre-wrap"}}>{pretty(assessment.observation||{})}</pre></details>
        </div>
      </div>

      <section className="section panel">
        <h2>Rule findings</h2>
        <div style={{overflowX:"auto"}}>
          <table className="matrix">
            <thead><tr><th>Rule</th><th>Status</th><th>Reason</th></tr></thead>
            <tbody>
              {(assessment.findings||[]).map(f=><tr key={f.rule_id}><td className="mono">{f.rule_id}</td><td><span className="status">{f.status}</span></td><td>{f.reason}</td></tr>)}
              {(!assessment.findings||assessment.findings.length===0)&&<tr><td colSpan={3}>No finalized findings for this generation.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section panel">
        <h2>Migration rules</h2>
        <pre className="mono" style={{whiteSpace:"pre-wrap"}}>{pretty(route.rules)}</pre>
      </section>
    </main>;
  }catch(error){
    return <main className="wrap section">
      <div className="eyebrow">Evidence · {id} / {routeId}</div>
      <h1>Unable to load route evidence</h1>
      <div className="notice">{error instanceof Error?error.message:String(error)}</div>
    </main>;
  }
}
