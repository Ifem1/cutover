import "./globals.css";
import Link from "next/link";
import {WalletSessionProvider} from "@/components/WalletSession";
export const metadata={title:"CUTOVER",description:"GenLayer-backed migration acceptance protocol"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><WalletSessionProvider><header className="wrap nav"><Link className="brand" href="/">CUTOVER</Link><nav className="navlinks" aria-label="Primary"><Link href="/migrations">Migrations</Link><Link href="/verify">Verify</Link><Link href="/integrations/github">GitHub gate</Link><Link href="/how">How it works</Link><Link href="/security">Security</Link></nav></header>{children}<footer className="wrap section muted">CUTOVER · Studionet 61999 · Stable tooling only.</footer></WalletSessionProvider></body></html>}
