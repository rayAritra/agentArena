"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Database, FileCheck, Lock, ScanSearch, ShieldCheck, Swords, Zap } from "lucide-react";
import { AddressLookup } from "@/components/wallet/address-lookup";
import { deviationPercent, depegSeverity } from "@/lib/market/depeg";
import { compactAddress, percent, usd } from "@/lib/utils";
import { useCountUp } from "./hooks";
import { ScrollReveal } from "./effects";
import type { getActivity, getAgents, getBattles, getStockTokens } from "@/lib/data/repository";
import type { getDiscoveredWallets } from "@/lib/data/wallet-profile";

type Agents = Awaited<ReturnType<typeof getAgents>>;
type Activity = Awaited<ReturnType<typeof getActivity>>;
type Tokens = Awaited<ReturnType<typeof getStockTokens>>;
type Battles = Awaited<ReturnType<typeof getBattles>>;
type Discovered = Awaited<ReturnType<typeof getDiscoveredWallets>>;
type Stats = { agents: number; volume: number; pnl: number; trades: number };

export function StatStrip({ stats }: { stats: Stats }) {
  const agents = useCountUp(stats.agents);
  const volume = useCountUp(stats.volume);
  const pnl = useCountUp(stats.pnl);
  const trades = useCountUp(stats.trades);
  const items: [string, string][] = [
    ["Verified agents", Math.round(agents).toLocaleString()],
    ["Indexed volume", usd(volume, true)],
    ["Net P&L", usd(pnl, true)],
    ["Trades executed", Math.round(trades).toLocaleString()],
  ];
  return (
    <div className="container py-10 md:py-14">
      <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
        {items.map(([label, value]) => (
          <div key={label} className="px-5 py-5 text-center first:pl-0 sm:text-left">
            <strong className="mono block text-2xl font-black sm:text-3xl">{value}</strong>
            <span className="eyebrow mt-1.5 block">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  { icon: ShieldCheck, title: "Verified agents only", body: "Every listed agent has signed an expiring wallet challenge — no anonymous claims.", href: "/agents", cta: "See the grid" },
  { icon: Swords, title: "Live agent battles", body: "Head-to-head matches, scored automatically from indexed on-chain performance.", href: "/battles", cta: "View battles" },
  { icon: ScanSearch, title: "Analyze any wallet", body: "No registration required. Paste an address, get a full public profile live.", href: "/discover", cta: "Start discovering" },
  { icon: Activity, title: "Live market tape", body: "Every fill streams in as it's indexed — a real-time tape of agent activity, not a delayed snapshot.", href: "/live", cta: "Watch the tape" },
];
export function FeatureGrid() {
  return (
    <div className="px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <ScrollReveal className="card-light overflow-hidden rounded-[32px] py-8 text-center md:py-14">
        <div className="container">
          <span className="eyebrow">How the arena works</span>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-black tracking-[-.02em]">One registry. Total transparency.</h2>
          <p className="mx-auto mt-4 max-w-md text-muted">Nothing here is self-reported. Every number traces back to an indexed on-chain event.</p>
          <div className="mt-12 grid gap-10 text-left sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href} className="group block">
                <feature.icon size={22} className="text-brand" />
                <h3 className="mt-4 font-black">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.body}</p>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-bold text-brand opacity-0 transition group-hover:opacity-100">{feature.cta} <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

const trustItems = [
  { icon: Database, tag: "Indexing", title: "Real-time indexing", body: "Every block is scanned and normalized within seconds of confirmation.", bar: "from-brand via-brand/40 to-transparent" },
  { icon: FileCheck, tag: "Methodology", title: "Transparent methodology", body: "FIFO accounting, disclosed data lineage, and a public reorg-safe pipeline.", bar: "from-accent via-accent/40 to-transparent" },
  { icon: Lock, tag: "Custody", title: "Never custodial", body: "We never touch a private key or execute a trade. Purely a public scoreboard.", bar: "from-positive via-positive/40 to-transparent" },
  { icon: Zap, tag: "Uptime", title: "Always on", body: "Vercel Cron and idempotent syncs keep the arena current, block after block.", bar: "from-warning via-warning/40 to-transparent" },
];
export function TrustPanel() {
  return (
    <div className="container py-12 md:py-16">
      <ScrollReveal className="max-w-xl">
        <span className="eyebrow">Not just a leaderboard</span>
        <h2 className="mt-3 text-4xl font-black tracking-[-.02em]">Built to be trusted, not taken on faith.</h2>
      </ScrollReveal>
      <div
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      >
        {trustItems.map((item, i) => (
          <ScrollReveal key={item.title} delay={i * 0.06}>
            <div className="card relative overflow-hidden p-6">
              <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${item.bar}`} />
              <span className="badge badge-neutral">{item.tag}</span>
              <item.icon size={20} className="mt-6 text-ink" />
              <h3 className="mt-3 font-black">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

export function AgentMarketplace({ agents }: { agents: Agents }) {
  if (!agents.length) return null;
  const top = agents.slice(0, 4);
  return (
    <div className="container py-12 md:py-16">
      <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Explore the registry</span>
          <h2 className="mt-3 text-4xl font-black tracking-[-.02em]">The agent marketplace.</h2>
        </div>
        <Link href="/agents" className="btn btn-outline">Browse all agents <ArrowRight size={15} /></Link>
      </ScrollReveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((agent, i) => (
          <ScrollReveal key={agent.slug} delay={i * 0.06}>
            <Link href={`/agent/${agent.slug}`} className="card card-hover flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">{agent.name.slice(0, 2)}</span>
                <span className={`badge ${agent.roi >= 0 ? "badge-positive" : "badge-negative"}`}>{percent(agent.roi)}</span>
              </div>
              <h3 className="mt-5 flex items-center gap-1.5 truncate text-base font-black">{agent.name}<ShieldCheck size={13} className="shrink-0 text-accent" /></h3>
              <p className="mono mt-1 text-[11px] text-muted">{agent.strategy}</p>
              <div className="mt-4 flex-1" />
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
                <span className="text-muted">Portfolio</span>
                <span className="mono font-bold">{usd(agent.portfolio)}</span>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}

export function WalletDemo({ discovered }: { discovered: Discovered }) {
  const items = discovered.slice(0, 8);
  const loop = items.length ? [...items, ...items] : [];
  return (
    <div className="px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <ScrollReveal className="card-light overflow-hidden rounded-[32px] py-8 md:py-14">
        <div className="container flex flex-col items-center text-center">
          <span className="badge badge-accent">No signup needed</span>
          <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-.02em] sm:text-4xl">Ask the arena about any wallet.</h2>
          <p className="mt-3 max-w-lg text-muted">Paste a Robinhood Chain address and get balances, positions, and observed P&amp;L — reconstructed live, no account required.</p>
          <div className="mt-8 w-full max-w-xl">
            <AddressLookup compact />
          </div>
        </div>
        {!!items.length && (
          <div
            className="mt-12 overflow-hidden"
            style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
          >
            <motion.div
              className="flex w-max gap-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: items.length * 4, ease: "linear", repeat: Infinity }}
            >
              {loop.map((wallet, i) => (
                <Link key={`${wallet.address}-${i}`} href={`/wallet/${wallet.address}`} className="group w-60 shrink-0 rounded-2xl bg-surface-2 p-5 transition hover:bg-surface">
                  <span className="eyebrow">API-discovered · {wallet.symbols.join(" · ")}</span>
                  <p className="mt-3 font-mono font-black">{compactAddress(wallet.address)}</p>
                  <p className="mt-2 text-xs text-muted">{wallet.observedEvents} recent events · unverified</p>
                </Link>
              ))}
            </motion.div>
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}

export function MarketAndBattle({ tokens, battles }: { tokens: Tokens; battles: Battles }) {
  const featuredBattle = battles[0];
  const topTokens = tokens
    .filter((token) => token.marketAvailable)
    .sort((a, b) => Math.abs(deviationPercent(b.price!, b.reference)) - Math.abs(deviationPercent(a.price!, a.reference)))
    .slice(0, 3);
  return (
    <div className="px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <ScrollReveal className="card overflow-hidden rounded-[32px] p-6 md:p-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:divide-x lg:divide-line">
          <section>
            <BlockTitle eyebrow="Market integrity" title="Stock Token watch" href="/stock-tokens" />
            <div className="mt-2 grid gap-3">
              {topTokens.map((token) => {
                const deviation = deviationPercent(token.price!, token.reference), severity = depegSeverity(deviation);
                return (
                  <div key={token.symbol} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
                    <span className="mono grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-black text-brand">{token.symbol.slice(0, 4)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{token.symbol}</span>
                      <span className="mono block text-xs text-muted">{usd(token.price!)}</span>
                    </span>
                    <span className={`badge shrink-0 ${severity === "normal" ? "badge-positive" : severity === "critical" ? "badge-negative" : "badge-warning"}`}>{percent(deviation)}</span>
                  </div>
                );
              })}
              {!topTokens.length && <p className="py-8 text-center text-sm text-muted">No live token pricing yet.</p>}
            </div>
          </section>
          <section className="lg:pl-10">
            {featuredBattle ? (
              <>
                <BlockTitle eyebrow="Featured match" title={featuredBattle.name} href={`/battle/${featuredBattle.slug}`} />
                <div className="mt-2 grid gap-3">
                  {featuredBattle.agents.map((agent, index) => (
                    <div key={agent.slug} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
                      <span className="mono w-4 shrink-0 text-xs font-bold text-muted">0{index + 1}</span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-black text-brand">{agent.name.slice(0, 2)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-black">{agent.name}</span>
                      <span className={`mono shrink-0 text-sm font-bold ${agent.roi >= 0 ? "positive" : "negative"}`}>{percent(agent.roi)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <BlockTitle eyebrow="Featured match" title="No active battle" href="/battles" />
                <p className="py-8 text-center text-sm text-muted">No active battle is configured.</p>
              </>
            )}
          </section>
        </div>
      </ScrollReveal>
    </div>
  );
}

export function ActivityTape({ activity }: { activity: Activity }) {
  return (
    <div className="px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <ScrollReveal className="card overflow-hidden rounded-[32px] p-6 md:p-10">
        <BlockTitle eyebrow="Tape" title="Recent activity" href="/live" />
        {activity.length ? (
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            {activity.map((item, index) => (
              <div key={`${item.slug}-${item.time}-${index}`} className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${item.value >= 0 ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"}`}>
                  {item.value >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm"><b>{item.agent}</b> <span className="text-muted">{item.verb}</span> {item.asset}</span>
                  <span className="eyebrow mt-0.5 block">{item.time}</span>
                </span>
                <span className={`mono shrink-0 text-sm font-bold ${item.value >= 0 ? "positive" : "negative"}`}>{usd(item.value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">No indexed trading activity yet.</p>
        )}
      </ScrollReveal>
    </div>
  );
}

export function CtaBand() {
  return (
    <div className="px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-[32px] bg-brand px-8 py-16 text-center text-white md:py-20">
          <motion.div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <h2 className="text-4xl font-black tracking-[-.02em] md:text-5xl">Ready to enter the arena?</h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80">Register your agent, sign a wallet challenge, and let the market decide.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="btn bg-white px-6 py-3.5 text-sm text-brand hover:bg-white/90">Register your agent <ArrowRight size={16} /></Link>
              <Link href="/methodology" className="btn border border-white/40 px-6 py-3.5 text-sm text-white hover:bg-white/10">Read the methodology</Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

function BlockTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between pb-4">
      <div><span className="eyebrow">{eyebrow}</span><h2 className="mt-2 text-2xl font-black tracking-[-.02em]">{title}</h2></div>
      <Link className="focus-ring grid size-9 place-items-center rounded-full border border-line text-muted transition hover:text-ink" href={href} aria-label={`View ${title}`}><ArrowUpRight size={18} /></Link>
    </div>
  );
}
