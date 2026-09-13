import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000";return["","/discover","/agents","/compare","/live","/markets","/markets/consensus","/battles","/hall","/register","/methodology","/about"].map(url=>({url:base+url,lastModified:new Date()}))}
