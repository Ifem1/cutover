import "./globals.css";
import {WalletSessionProvider} from "@/components/WalletSession";
import {GlobalNavbar} from "@/components/GlobalNavbar";
export const metadata={title:"CUTOVER",description:"GenLayer-backed migration acceptance protocol"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><WalletSessionProvider><GlobalNavbar/>{children}<footer className="wrap section muted">CUTOVER · Studionet 61999 · Stable tooling only.</footer></WalletSessionProvider></body></html>}
