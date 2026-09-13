import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { ShareActions } from "@/components/agents/share-actions";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { ScrollReveal } from "@/components/home/effects";
import { DataRow } from "@/components/ui/data-row";
import { MetricStrip } from "@/components/ui/metric-strip";
import { getAgent } from "@/lib/data/repository";
import { getAgentIntelligence } from "@/lib/data/intelligence";
import { compactAddress,percent,usd } from "@/lib/utils";

export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const a=await getAgent((await params).slug);return a?{title:`${a.name} — ${percent(a.roi)} ROI`,description:a.description,openGraph:{images:[`/api/og/agent/${a.slug}`]}}:{title:"Agent not found"}}

export default async function AgentPage({params}:{params:Promise<{slug:string}>}){
  const a=await getAgent((await params).slug);if(!a)notFound();
  if(!a.verified)redirect(`/wallet/${a.wallet}`);
  const intelligence=await getAgentIntelligence(a.slug);
  const score=intelligence?.score as Record<string,unknown>|null,dna=intelligence?.dna as Record<string,unknown>|null;
  const metrics=[
    {label:"Arena Score",value:score?String(score.arena_score):"—"},
    {label:"Agent DNA",value:dna?String(dna.primary_archetype):"Pending"},
    {label:"Portfolio value",value:usd(a.portfolio)},
    {label:"Total P&L",value:usd(a.pnl),tone:a.pnl>=0?"positive" as const:"negative" as const},
    {label:"Total ROI",value:percent(a.roi),tone:a.roi>=0?"positive" as const:"negative" as const},
    {label:"24H P&L",value:usd(a.day),tone:a.day>=0?"positive" as const:"negative" as const},
    {label:"Win rate",value:`${a.winRate.toFixed(1)}%`},
    {label:"Trades",value:String(a.trades)},
    {label:"Volume",value:usd(a.volume,true)},
    {label:"Best trade",value:usd(a.bestTrade)},
  ];
  const riskRows=[["Profit factor",a.profitFactor.toFixed(2)],["Max drawdown",percent(a.maxDrawdown)],["Average win",usd(a.averageWin)],["Average loss",usd(a.averageLoss)],["Realized P&L",usd(a.realizedPnl)],["Unrealized P&L",usd(a.unrealizedPnl)]];
  return <div className="container py-12"><div className="grid gap-10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><span className="eyebrow">Verified autonomous trader</span><h1 className="mt-4 flex items-center gap-3 text-4xl font-black tracking-[-.03em] sm:text-5xl">{a.name}<ShieldCheck className="text-accent"/></h1><p className="mono mt-4 text-xs text-muted">{compactAddress(a.wallet)} · {a.model} · {a.strategy}</p><p className="mt-6 max-w-2xl text-muted">{a.description}</p></div><ShareActions name={a.name} rank={a.rank} roi={percent(a.roi)} path={`/agent/${a.slug}`}/></div>
    <div className="card overflow-hidden"><MetricStrip className="grid-cols-2 md:grid-cols-5 xl:grid-cols-10" items={metrics}/></div>
    <ScrollReveal className="mt-12 grid gap-6 lg:grid-cols-[2fr_1fr]"><section className="card p-6"><div className="flex justify-between"><span className="eyebrow">Portfolio value · all indexed history</span><span className="eyebrow">Block {a.lastSyncedBlock??"pending first sync"}</span></div><PerformanceChart values={a.series} negative={a.pnl<0}/></section><aside className="card p-4 sm:p-6"><span className="eyebrow block pb-3">Risk &amp; execution</span><div className="grid gap-2">{riskRows.map(([label,value])=><div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-sm" key={label}><span className="text-muted">{label}</span><span className="mono font-bold">{value}</span></div>)}</div></aside></ScrollReveal>
    <section className="mt-14"><div className="flex items-end justify-between pb-4"><div><span className="eyebrow">Canonical holdings</span><h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Positions</h2></div><Link href="/methodology" className="text-xs font-black text-brand">FIFO methodology</Link></div>{a.positions.length?<ScrollReveal className="card grid gap-3 p-4 sm:p-6">{a.positions.map(p=><DataRow key={p.assetAddress} icon={p.symbol.slice(0,4)} title={p.symbol} subtitle={`${p.quantity} qty @ ${usd(p.currentPrice)} · cost ${usd(p.costBasis)}`} trailing={usd(p.marketValue)} trailingSub={<span className={p.unrealizedPnl>=0?"positive":"negative"}>{usd(p.unrealizedPnl)} unrealized</span>}/>)}</ScrollReveal>:<p className="card py-10 text-center text-sm text-muted">No open canonical Stock Token positions at the latest indexed block.</p>}</section>
    <section className="mt-14"><span className="eyebrow">Normalized onchain execution</span><h2 className="mt-2 text-2xl font-black tracking-[-.02em]">Recent trades</h2>{a.recentTrades.length?<ScrollReveal className="card mt-5 grid gap-3 p-4 sm:p-6">{a.recentTrades.map(t=><DataRow key={t.id} href={`https://robinhoodchain.blockscout.com/tx/${t.txHash}`} external iconTone={t.side==="buy"?"positive":"negative"} icon={t.side==="buy"?<ArrowUpRight size={16}/>:<ArrowDownRight size={16}/>} title={`${t.side.toUpperCase()} ${t.symbol}`} subtitle={new Date(t.tradedAt).toLocaleString("en-US",{timeZone:"UTC"})+" UTC"} trailing={usd(t.quoteAmount)} trailingSub={`${usd(t.price)}/unit · fee ${usd(t.fee)}`}/>)}</ScrollReveal>:<p className="card mt-5 py-10 text-center text-sm text-muted">No qualifying USDG/Stock Token trades have been indexed for this wallet yet.</p>}</section>
  </div>;
}
