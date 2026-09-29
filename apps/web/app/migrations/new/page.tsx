import {ActionConsole} from "@/components/ActionConsole";
import {NotConfigured} from "@/components/NotConfigured";
import {isConfigured} from "@/lib/config";

export default function Page(){
  return <main className="wrap section">
    <div className="eyebrow">Create</div>
    <h1>Build the frozen baseline</h1>
    <div className="two">
      <div className="panel">
        <h2>1. Create the migration</h2>
        <p>Use <code>create_migration</code> with a title, the public baseline origin, and a review window between 300 and 604800 seconds.</p>
        <p className="muted">The action console below submits the exact contract arguments. After finalization, open the migration register to continue with the new ID.</p>
      </div>
      <div className="panel">
        <h2>2. Register routes and rules</h2>
        <p>On the migration control-room page, add each required route, freeze its bounded baseline snapshot, then seal the baseline before setting a candidate.</p>
        <p className="muted">A route supports up to 12 interpretation rules. Snapshot identity and SHA-256 are checked before GenLayer authenticates the frozen baseline.</p>
      </div>
    </div>
    {!isConfigured()&&<div className="section"><NotConfigured/></div>}
    <section className="section"><ActionConsole/></section>
  </main>;
}
