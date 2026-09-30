import {MigrationWorkbench,type WorkbenchMigration,type WorkbenchRoute} from "@/components/MigrationWorkbench";
import {NotConfigured} from "@/components/NotConfigured";
import {RouteMatrix} from "@/components/RouteMatrix";
import {CONTRACT_ADDRESS,NETWORK,isConfigured} from "@/lib/config";
import {readCutover} from "@/lib/contract";
import type {MigrationState} from "@/lib/policy";
export const dynamic="force-dynamic";

type MigrationRecord={id:number;owner:string;title:string;state:string;baseline_origin:string;baseline_generation:number;review_window_seconds:number;route_ids:string[];candidate_origin:string;candidate_ref:string;candidate_manifest_url:string;candidate_manifest_digest:string;candidate_generation:number;aggregate:string;assessed_generation:number;ready_at:number;review_deadline:number;challenge_open:boolean};
type Rule={id:string;question:string;allowed_changes:string};
type RouteRecord={route_id:string;baseline_url:string;candidate_path:string;rules:Rule[];baseline_snapshot_url:string;baseline_digest:string;baseline_frozen:boolean};
type Finding={rule_id:string;status:string};
type Assessment={route_result?:string;findings?:Finding[];attempt?:number;assessment_digest?:string};
type Authorization={candidate_generation?:number;candidate_ref?:string;candidate_manifest_digest?:string;evidence_root?:string;authorization_digest?:string};
type Challenge={id?:number;route_id?:string;route_attempt?:number;resolved?:boolean};
const at=(n:number)=>n?new Date(n*1000).toISOString():"Not started";
function decisive(a:Assessment){const f=(a.findings||[]).find(x=>["MATERIAL_CHANGE","MISSING","BROKEN","CONFLICTING","UNREADABLE"].includes(x.status));return f?`${f.rule_id}: ${f.status}`:(a.findings?.length?"All consensus-bound rule statuses pass.":"No current-generation assessment.");}

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const mid=Number(id);
 if(!isConfigured())return <main className="wrap section"><div className="eyebrow">Control room · migration {id}</div><h1>Baseline → candidate</h1><NotConfigured/></main>;
 if(!Number.isInteger(mid)||mid<=0)return <main className="wrap section"><h1>Invalid migration ID</h1></main>;
 try{
  const migration=await readCutover("get_migration",[mid]) as MigrationRecord;
  const routePairs=await Promise.all((migration.route_ids||[]).map(async routeId=>{const [route,assessment]=await Promise.all([readCutover("get_route",[mid,routeId]) as Promise<RouteRecord>,migration.candidate_generation?readCutover("get_route_assessment",[mid,migration.candidate_generation,routeId]) as Promise<Assessment>:Promise.resolve({} as Assessment)]);return {route,assessment};}));
  const [challenges,authorization]=await Promise.all([migration.candidate_generation?readCutover("get_challenges",[mid,migration.candidate_generation,0,50]) as Promise<Challenge[]>:Promise.resolve([] as Challenge[]),readCutover("get_authorization",[mid]) as Promise<Authorization>]);
  const rows=routePairs.map(({route,assessment})=>({id:route.route_id,href:`/migrations/${mid}/routes/${encodeURIComponent(route.route_id)}`,route:route.baseline_url,destination:migration.candidate_origin?migration.candidate_origin+route.candidate_path:route.candidate_path,rules:route.rules.length,frozen:route.baseline_frozen,status:assessment.route_result||"NOT ASSESSED",attempts:Number(assessment.attempt||0),decisive:decisive(assessment)}));
  const wbRoutes:WorkbenchRoute[]=routePairs.map(({route,assessment})=>({...route,assessment,challenge_attempts:challenges.filter(c=>c.route_id===route.route_id).length}));
  const wbMigration:WorkbenchMigration={id:mid,owner:migration.owner,state:migration.state as MigrationState,candidate_generation:migration.candidate_generation,assessed_generation:migration.assessed_generation,review_deadline:migration.review_deadline,challenge_open:migration.challenge_open,challenge_count:challenges.length,candidate_origin:migration.candidate_origin,candidate_ref:migration.candidate_ref,candidate_manifest_url:migration.candidate_manifest_url,candidate_manifest_digest:migration.candidate_manifest_digest};
  const progress=migration.ready_at&&migration.review_deadline?Math.max(0,Math.min(100,((Math.floor(Date.now()/1000)-migration.ready_at)/(migration.review_deadline-migration.ready_at))*100)):0;
  return <main className="wrap section"><div className="controlHero"><div><div className="eyebrow">Control room · migration {id}</div><h1>{migration.title}</h1><p className="lead">Finalized Studionet state. Candidate identity comes from its verified same-origin manifest, not an owner-entered release string.</p></div><div className={`stateStamp ${migration.state.toLowerCase()}`}><small>STATE</small>{migration.state}</div></div>
   <section className="identityStrip"><div><small>Candidate generation</small><b>{migration.candidate_generation||"—"}</b></div><div><small>Verified release ref</small><code>{migration.candidate_ref||"Not registered"}</code></div><div><small>Manifest SHA-256</small><code>{migration.candidate_manifest_digest||"Not registered"}</code></div><div><small>Contract</small><a href={NETWORK.explorer} target="_blank" rel="noreferrer">{CONTRACT_ADDRESS.slice(0,10)}… ↗</a></div></section>
   <RouteMatrix rows={rows}/>
   <section className="reviewBand"><div><div className="eyebrow">Review window</div><h2>{migration.state==="READY"?"Human review is open":"Review clock starts only after READY"}</h2><p><b>Ready:</b> {at(migration.ready_at)} · <b>Deadline:</b> {at(migration.review_deadline)}</p><progress aria-label="Review window progress" max={100} value={progress}/></div><div><div className="eyebrow">Challenges</div><p><b>{challenges.length}</b> verified challenge(s) recorded for generation {migration.candidate_generation||"—"}.</p><p>{migration.challenge_open?"Authorization is blocked by an unresolved challenge.":"No unresolved challenge currently blocks authorization."}</p></div></section>
   {authorization.authorization_digest&&<section className="authorizationCard"><div className="eyebrow">Authorized evidence set</div><h2>Exact candidate evidence root</h2><code>{authorization.evidence_root}</code><p>Manifest <code>{authorization.candidate_manifest_digest}</code></p><p>Authorization <code>{authorization.authorization_digest}</code></p></section>}
   <MigrationWorkbench migration={wbMigration} routes={wbRoutes}/>
  </main>;
 }catch(error){return <main className="wrap section"><h1>Unable to load migration</h1><div className="notice">{error instanceof Error?error.message:String(error)}</div></main>}
}
