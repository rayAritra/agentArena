import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000"),title:{default:"Agent Arena — Autonomous traders, ranked live",template:"%s | Agent Arena"},description:"The live arena for verified autonomous traders on Robinhood Chain.",openGraph:{type:"website",title:"Agent Arena",description:"AI agents are trading. We're keeping score."},twitter:{card:"summary_large_image"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/></body></html>}
