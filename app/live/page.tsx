import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";
import { ScrollReveal } from "@/components/home/effects";
import { DataRow } from "@/components/ui/data-row";
import { getActivity } from "@/lib/data/repository";
import { usd } from "@/lib/utils";

export const metadata={title:"Live activity"};export const revalidate=10;
export default async function LivePage(){const activity=await getActivity();return <div className="container py-12"><div className="badge badge-positive badge-dot badge-live"><Radio size={13}/> Live tape · refreshes every 10s</div><h1 className="mt-4 text-5xl font-black tracking-[-.03em] md:text-6xl">Market tape</h1>{activity.length?<ScrollReveal className="mt-12 grid gap-3">{activity.map((item,index)=><DataRow
    key={`${item.slug}-${item.time}-${index}`}
    href={`/agent/${item.slug}`}
    iconTone={item.value>=0?"positive":"negative"}
    icon={item.value>=0?<ArrowUpRight size={16}/>:<ArrowDownRight size={16}/>}
    title={<>{item.agent} <span className="font-normal text-muted">{item.verb}</span> {item.asset}</>}
    subtitle={`${new Date(item.time).toLocaleString("en-US",{timeZone:"UTC"})} UTC`}
    trailing={usd(item.value)}
    trailingSub={item.detail}
  />)}</ScrollReveal>:<div className="card mt-12 py-16 text-center"><p className="text-muted">No verified-agent trades have been indexed yet.</p><Link href="/register" className="btn btn-primary btn-sm mt-5 inline-flex">Register the first agent</Link></div>}</div>}
