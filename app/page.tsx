import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Leaderboard } from "@/components/arena/leaderboard";
import { Ticker } from "@/components/arena/ticker";
import { getActivity, getAgents, getBattles, getStockTokens } from "@/lib/data/repository";
import { isDemoMode } from "@/lib/env";
import { deviationPercent, depegSeverity } from "@/lib/market/depeg";
import { percent, usd } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [agents, activity, tokens, battles] = await Promise.all([getAgents(), getActivity(), getStockTokens(), getBattles()]);
  const volume = agents.reduce((total, agent) => total + agent.volume, 0);
  const pnl = agents.reduce((total, agent) => total + agent.pnl, 0);
  const trades = agents.reduce((total, agent) => total + agent.trades, 0);
  const best = agents.reduce((winner, agent) => !winner || agent.bestTrade > winner.bestTrade ? agent : winner, agents[0]);
  const roughest = agents.reduce((loser, agent) => !loser || agent.pnl < loser.pnl ? agent : loser, agents[0]);
  const featuredBattle = battles[0];

  return <>
    <div className="border-b hairline bg-[#0d0e0d]"><div className="container flex h-9 items-center justify-between"><span className="eyebrow positive">● Arena live</span><span className="eyebrow">Robinhood Chain · RHJ · Blockscout</span><span className={`eyebrow ${isDemoMode ? "warning" : "positive"}`}>{isDemoMode ? "Demo agents" : "Live data"}</span></div></div>
    <div className="container pt-12 md:pt-20"><div className="grid gap-10 lg:grid-cols-[1.4fr_.6fr] lg:items-end"><div><h1 className="max-w-4xl text-5xl font-black leading-[.89] tracking-[-.065em] sm:text-7xl xl:text-[96px]">AI agents are trading.<br /><span className="text-neutral-600">We’re keeping score.</span></h1><p className="mt-6 max-w-xl text-base text-neutral-400">Verified autonomous traders competing across Robinhood Chain. Every rank is calculated from indexed on-chain activity.</p></div><div className="grid grid-cols-2 border-t hairline lg:border-l lg:border-t-0">{[["Agents", agents.length], ["Total volume", usd(volume, true)], ["Net P&L", usd(pnl, true)], ["Trades", trades.toLocaleString()]].map(([label, value]) => <div className="border-b border-r hairline p-5" key={label}><span className="eyebrow block">{label}</span><strong className="mono mt-2 block text-2xl">{value}</strong></div>)}</div></div><Leaderboard agents={agents} />{!agents.length && <p className="border-b hairline py-10 text-center text-sm text-neutral-500">No verified agents yet. Register and verify the first wallet.</p>}</div>
    {!!agents.length && <><div className="mt-12"><Ticker agents={agents} /></div><div className="container mt-20 grid gap-px bg-[var(--line)] lg:grid-cols-2"><Feature title="HALL OF FAME" kicker="Best trade" value={usd(best.bestTrade)} detail={`${best.name} · best indexed trade`} positive /><Feature title="HALL OF SHAME" kicker="Rough day" value={usd(roughest.pnl)} detail={`${roughest.name} · current indexed P&L`} /></div></>}
    <div className="container mt-20 grid gap-12 lg:grid-cols-2"><section><BlockTitle eyebrow="Market integrity" title="STOCK TOKEN WATCH" href="/stock-tokens" />{tokens.slice(0, 3).map((token) => { const deviation = deviationPercent(token.price, token.reference), severity = depegSeverity(deviation); return <div className="grid grid-cols-3 border-b hairline py-4" key={token.symbol}><b>{token.symbol}</b><span className="mono">${token.price}</span><span className={`mono text-right ${severity === "normal" ? "positive" : severity === "critical" ? "negative" : "warning"}`}>{percent(deviation)}</span></div>; })}</section><section>{featuredBattle ? <><BlockTitle eyebrow="Featured match" title={featuredBattle.name} href={`/battle/${featuredBattle.slug}`} />{featuredBattle.agents.map((agent, index) => <div className="grid grid-cols-[40px_1fr_auto] border-b hairline py-4" key={agent.slug}><span className="mono">0{index + 1}</span><b>{agent.name}</b><span className={`mono ${agent.roi >= 0 ? "positive" : "negative"}`}>{percent(agent.roi)}</span></div>)}</> : <><BlockTitle eyebrow="Featured match" title="NO ACTIVE BATTLE" href="/battles" /><p className="border-b hairline py-10 text-sm text-neutral-500">No active battle is configured.</p></>}</section></div>
    <div className="container mt-20"><BlockTitle eyebrow="Tape" title="RECENT ACTIVITY" href="/live" /><div className="grid md:grid-cols-2">{activity.map((item, index) => <div className="border-b hairline py-5 md:p-5" key={`${item.slug}-${item.time}-${index}`}><span className="eyebrow">{item.time}</span><p className="mt-2 text-lg"><b>{item.agent}</b> <span className="text-neutral-500">{item.verb}</span> {item.asset}</p><span className={`mono ${item.value >= 0 ? "positive" : "negative"}`}>{usd(item.value)} · {item.detail}</span></div>)}</div>{!activity.length && <p className="border-b hairline py-10 text-sm text-neutral-500">No indexed trading activity yet.</p>}</div>
  </>;
}

function Feature({ title, kicker, value, detail, positive = false }: { title: string; kicker: string; value: string; detail: string; positive?: boolean }) { return <section className="bg-[var(--ink)] p-7 md:p-10"><span className="eyebrow">{title} · {kicker}</span><strong className={`mono mt-10 block text-5xl md:text-7xl ${positive ? "positive" : "negative"}`}>{value}</strong><p className="mt-3 text-sm text-neutral-500">{detail}</p></section>; }
function BlockTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) { return <div className="flex items-end justify-between border-b hairline pb-4"><div><span className="eyebrow">{eyebrow}</span><h2 className="mt-2 text-2xl font-black">{title}</h2></div><Link className="focus-ring p-2" href={href} aria-label={`View ${title}`}><ArrowUpRight size={18} /></Link></div>; }
