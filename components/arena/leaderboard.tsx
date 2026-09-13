"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Agent } from "@/lib/demo/data";
import { compactAddress, percent, usd } from "@/lib/utils";

const filters = ["Overall", "24H P&L", "Win Rate", "Most Active"] as const;
export function Leaderboard({ agents }: { agents: Agent[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Overall");
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = useMemo(() => [...agents].sort((a, b) => filter === "24H P&L" ? b.day - a.day : filter === "Win Rate" ? b.winRate - a.winRate : filter === "Most Active" ? b.trades - a.trades : b.roi - a.roi), [agents, filter]);
  return <section aria-labelledby="leaderboard-title" className="mt-16">
    <div className="flex flex-col justify-between gap-5 pb-5 md:flex-row md:items-end">
      <div><span className="eyebrow">Global standings</span><h2 id="leaderboard-title" className="mt-2 text-3xl font-black tracking-[-.03em]">Live leaderboard</h2></div>
      <div className="flex gap-1.5 overflow-auto" role="tablist">{filters.map((item) => <button role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className="pill-tab" key={item}>{item}</button>)}</div>
    </div>
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[56px_2fr_repeat(7,1fr)] gap-3 border-b border-line px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted lg:grid"><span>Rank</span><span>Agent</span><span>Portfolio</span><span>Total P&amp;L</span><span>ROI</span><span>24H P&amp;L</span><span>Win rate</span><span>Trades</span><span>Volume</span></div>
      {sorted.length ? <motion.div layout>{sorted.map((agent, index) => <motion.div layout transition={{ duration: .35 }} key={agent.slug} className="border-b border-line last:border-b-0"><button onClick={() => setExpanded(expanded === agent.slug ? null : agent.slug)} className="focus-ring grid w-full grid-cols-[42px_1fr_auto_auto] items-center gap-3 px-5 py-4 text-left transition hover:bg-surface-2 lg:grid-cols-[56px_2fr_repeat(7,1fr)]"><span className="mono text-lg font-bold text-muted">{String(index + 1).padStart(2, "0")}</span><span className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">{agent.name.slice(0, 2)}</span><span className="min-w-0"><span className="flex items-center gap-1 truncate text-sm font-black">{agent.name}{agent.verified ? <ShieldCheck size={13} className="text-accent" /> : <span className="badge badge-warning"><ShieldAlert size={10} /> Observed</span>}</span><span className="mono block truncate text-[10px] text-muted">{agent.strategy} · {compactAddress(agent.wallet)}</span></span></span><span className="mono hidden text-sm lg:block">{usd(agent.portfolio)}</span><span className={`mono hidden text-sm font-bold lg:block ${agent.pnl >= 0 ? "positive" : "negative"}`}>{usd(agent.pnl)}</span><span className={`mono text-sm font-bold ${agent.roi >= 0 ? "positive" : "negative"}`}>{percent(agent.roi)}</span><span className={`mono hidden text-sm lg:block ${agent.day >= 0 ? "positive" : "negative"}`}>{usd(agent.day)}</span><span className="mono hidden text-sm lg:block">{agent.winRate.toFixed(1)}%</span><span className="mono hidden text-sm lg:block">{agent.trades}</span><span className="mono hidden text-sm lg:block">{usd(agent.volume, true)}</span><ChevronDown size={14} className={`text-muted transition lg:hidden ${expanded === agent.slug ? "rotate-180" : ""}`} /></button><AnimatePresence>{expanded === agent.slug && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden"><div className="grid grid-cols-3 gap-4 px-5 pb-5 pl-17.5"><Mini label="P&L" value={usd(agent.pnl)} /><Mini label="Win rate" value={`${agent.winRate}%`} /><Mini label="Trades" value={String(agent.trades)} /><Link className="col-span-3 text-xs font-black text-brand" href={`/agent/${agent.slug}`}>View profile →</Link></div></motion.div>}</AnimatePresence></motion.div>)}</motion.div> : <div className="py-14 text-center"><p className="text-sm text-muted">No competitors discovered yet. Run the protected sync or register a wallet.</p><Link href="/register" className="btn btn-primary btn-sm mt-4 inline-flex">Register an agent</Link></div>}
    </div>
  </section>;
}

function Mini({ label, value }: { label: string; value: string }) { return <span><span className="eyebrow block text-[9px]">{label}</span><span className="mono mt-1 block text-xs">{value}</span></span>; }
