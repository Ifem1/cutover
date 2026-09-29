import {CreateMigrationForm} from "@/components/CreateMigrationForm";
import {WalletBar} from "@/components/WalletSession";
import {NotConfigured} from "@/components/NotConfigured";
import {isConfigured} from "@/lib/config";
export default function Page(){return <main className="wrap section"><div className="eyebrow">Create</div><h1>Define the migration before judging it.</h1><p className="lead">Start with the source deployment and review window. Routes, rules, snapshots and candidate provenance are built on the migration control-room page after this transaction finalizes.</p>{!isConfigured()&&<NotConfigured/>}<WalletBar/><CreateMigrationForm/></main>}
