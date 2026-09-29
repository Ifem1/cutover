import Link from "next/link";
import {NotConfigured} from "@/components/NotConfigured";
import {isConfigured} from "@/lib/config";
import {readCutover} from "@/lib/contract";

export const dynamic="force-dynamic";

type MigrationSummary={
  id:number;
  title:string;
  state:string;
  candidate_ref:string;
  candidate_generation:number;
  route_ids:string[];
};

export default async function Page(){
  if(!isConfigured()){
    return <main className="wrap section">
      <div className="eyebrow">Register</div>
      <h1>Migrations</h1>
      <NotConfigured/>
      <p><Link className="button hot" href="/migrations/new">New migration</Link></p>
    </main>;
  }

  try{
    const migrations=await readCutover("list_migrations",[0,50]) as MigrationSummary[];
    return <main className="wrap section">
      <div className="eyebrow">Register</div>
      <h1>Migrations</h1>
      <p className="muted">Finalized contract state from Studionet. The register is capped to the first 50 entries in this view.</p>
      <p><Link className="button hot" href="/migrations/new">New migration</Link></p>
      <div className="grid section">
        {migrations.length===0&&<div className="panel"><p>No migrations are registered yet.</p></div>}
        {migrations.map(m=><Link key={m.id} href={`/migrations/${m.id}`} className="panel" style={{textDecoration:"none"}}>
          <div className="eyebrow">Migration {m.id}</div>
          <h2>{m.title}</h2>
          <p><span className="status">{m.state}</span></p>
          <p><b>Generation:</b> {m.candidate_generation}</p>
          <p><b>Routes:</b> {Array.isArray(m.route_ids)?m.route_ids.length:0}</p>
          <p className="mono">{m.candidate_ref||"No candidate ref"}</p>
        </Link>)}
      </div>
    </main>;
  }catch(error){
    return <main className="wrap section">
      <div className="eyebrow">Register</div>
      <h1>Unable to load migrations</h1>
      <div className="notice">{error instanceof Error?error.message:String(error)}</div>
    </main>;
  }
}
