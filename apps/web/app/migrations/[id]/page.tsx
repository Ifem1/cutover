import {ActionConsole,type ActionMigrationSnapshot} from "@/components/ActionConsole";
import {NotConfigured} from "@/components/NotConfigured";
import {RouteMatrix} from "@/components/RouteMatrix";
import {isConfigured} from "@/lib/config";
import {readCutover} from "@/lib/contract";
import type {MigrationState} from "@/lib/policy";

export const dynamic="force-dynamic";

type MigrationRecord={
  id:number;
  owner:string;
  state:string;
  baseline_origin:string;
  review_window_seconds:number;
  route_ids:string[];
  candidate_origin:string;
  candidate_ref:string;
  candidate_generation:number;
  aggregate:string;
  assessed_generation:number;
  ready_at:number;
  review_deadline:number;
  challenge_used_generation:number;
  challenge_open:boolean;
};

type Rule={id:string;question:string;allowed_changes:string};
type RouteRecord={
  route_id:string;
  baseline_url:string;
  candidate_path:string;
  rules:Rule[];
  baseline_snapshot_url:string;
  baseline_digest:string;
  baseline_frozen:boolean;
};

type Finding={rule_id:string;status:string;reason:string};
type AssessmentRecord={route_result?:string;findings?:Finding[]};
type ChallengeRecord={generation?:number;route_id?:string;challenger?:string;resolved?:boolean;route_result?:string};
type AuthorizationRecord={candidate_generation?:number;candidate_ref?:string;authorization_digest?:string};

function asTime(value:number){
  if(!value)return "Not started";
  return new Date(value*1000).toISOString();
}

function destination(origin:string,path:string){
  if(/^https?:\/\//.test(path))return path;
  return origin?origin+path:"Not set";
}

function decisiveFinding(assessment:AssessmentRecord){
  const findings=Array.isArray(assessment.findings)?assessment.findings:[];
  const decisive=findings.find(f=>["MATERIAL_CHANGE","MISSING","BROKEN","CONFLICTING","UNREADABLE"].includes(f.status));
  if(decisive)return `${decisive.rule_id}: ${decisive.status} — ${decisive.reason}`;
  if(findings.length)return "All assessed rules are preserved or explicitly allowed changes.";
  return "No finalized assessment for this generation.";
}

export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const migrationId=Number(id);

  if(!isConfigured()){
    return <main className="wrap section">
      <div className="eyebrow">Control room · migration {id}</div>
      <h1>Baseline → candidate</h1>
      <NotConfigured/>
      <section className="section"><ActionConsole migrationId={id}/></section>
    </main>;
  }

  if(!Number.isInteger(migrationId)||migrationId<=0){
    return <main className="wrap section"><h1>Invalid migration ID</h1><p>The migration ID must be a positive integer.</p></main>;
  }

  try{
    const migration=await readCutover("get_migration",[migrationId]) as MigrationRecord;
    const routeIds=Array.isArray(migration.route_ids)?migration.route_ids:[];
    const [routePairs,challenge,authorization]=await Promise.all([
      Promise.all(routeIds.map(async routeId=>{
        const [route,assessment]=await Promise.all([
          readCutover("get_route",[migrationId,routeId]) as Promise<RouteRecord>,
          migration.candidate_generation>0
            ? readCutover("get_route_assessment",[migrationId,migration.candidate_generation,routeId]) as Promise<AssessmentRecord>
            : Promise.resolve({} as AssessmentRecord),
        ]);
        return {routeId,route,assessment};
      })),
      readCutover("get_challenge",[migrationId]) as Promise<ChallengeRecord>,
      readCutover("get_authorization",[migrationId]) as Promise<AuthorizationRecord>,
    ]);

    const rows=routePairs.map(({route,assessment})=>({
      route:route.baseline_url,
      destination:destination(migration.candidate_origin,route.candidate_path),
      rules:Array.isArray(route.rules)?route.rules.length:0,
      status:assessment.route_result||"NOT ASSESSED",
      decisive:decisiveFinding(assessment),
    }));

    const uiMigration:ActionMigrationSnapshot={
      state:migration.state as MigrationState,
      owner:migration.owner,
      baselineSealed:migration.state!=="DRAFT",
      candidateGeneration:Number(migration.candidate_generation||0),
      assessedGeneration:Number(migration.assessed_generation||0),
      challengeOpen:Boolean(migration.challenge_open),
      challengeUsedGeneration:Number(migration.challenge_used_generation||0),
      reviewDeadline:Number(migration.review_deadline||0),
      authorized:migration.state==="AUTHORIZED",
    };

    return <main className="wrap section">
      <div className="eyebrow">Control room · migration {id}</div>
      <h1>Baseline → candidate</h1>
      <p className="muted">All values below are loaded from finalized Studionet contract state.</p>

      <div className="grid section">
        <div className="panel"><b>Candidate ref</b><p className="mono">{migration.candidate_ref||"Not set"}</p></div>
        <div className="panel"><b>Generation</b><p>{migration.candidate_generation}</p></div>
        <div className="panel"><b>Overall state</b><p className="stamp">{migration.state}</p></div>
      </div>

      <RouteMatrix rows={rows}/>

      <section className="section two">
        <div className="panel">
          <h2>Review window</h2>
          <p><b>Ready at:</b> {asTime(migration.ready_at)}</p>
          <p><b>Deadline:</b> {asTime(migration.review_deadline)}</p>
          <p><b>Window:</b> {migration.review_window_seconds} seconds</p>
        </div>
        <div className="panel">
          <h2>Challenge</h2>
          <p><b>Open:</b> {migration.challenge_open?"Yes":"No"}</p>
          <p><b>Used generation:</b> {migration.challenge_used_generation||"None"}</p>
          <p><b>Route:</b> {challenge.route_id||"None"}</p>
          <p><b>Resolved:</b> {typeof challenge.resolved==="boolean"?(challenge.resolved?"Yes":"No"):"N/A"}</p>
        </div>
      </section>

      <section className="section panel">
        <h2>Authorization</h2>
        <p><b>Authorized generation:</b> {authorization.candidate_generation??"None"}</p>
        <p><b>Authorized ref:</b> <span className="mono">{authorization.candidate_ref||"None"}</span></p>
        <p><b>Authorization digest:</b> <span className="mono">{authorization.authorization_digest||"None"}</span></p>
      </section>

      <section className="section"><ActionConsole migrationId={id} migration={uiMigration}/></section>
    </main>;
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    return <main className="wrap section">
      <div className="eyebrow">Control room · migration {id}</div>
      <h1>Unable to load finalized migration state</h1>
      <div className="notice">{message}</div>
    </main>;
  }
}
