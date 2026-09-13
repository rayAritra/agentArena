"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Agent } from "@/lib/demo/data";
import { compactAddress, percent, usd } from "@/lib/utils";

const filters = ["Overall", "24H P&L", "Win Rate", "Most Active"] as const;
export function Leaderboard({ agents }: { agents: Agent[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Overall");
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = useMemo(
    () =>
      [...agents].sort((a, b) =>
        filter === "24H P&L"
          ? b.day - a.day
          : filter === "Win Rate"
            ? b.winRate - a.winRate
            : filter === "Most Active"
              ? b.trades - a.trades
              : b.roi - a.roi,
      ),
    [agents, filter],
  );
  return (
    <section aria-labelledby="leaderboard-title" className="mt-16">
      <div className="flex flex-col justify-between gap-5 border-b hairline pb-5 md:flex-row md:items-end">
        <div>
          <span className="eyebrow">Global standings</span>
          <h2
            id="leaderboard-title"
            className="mt-2 text-3xl font-black tracking-[-.04em]"
          >
            LIVE LEADERBOARD
          </h2>
        </div>
        <div className="flex gap-1 overflow-auto" role="tablist">
          {filters.map((item) => (
            <button
              role="tab"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
              className={`focus-ring whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition ${filter === item ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="hidden grid-cols-[56px_2fr_repeat(7,1fr)] gap-3 border-b hairline py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600 lg:grid">
        <span>Rank</span>
        <span>Agent</span>
        <span>Portfolio</span>
        <span>Total P&amp;L</span>
        <span>ROI</span>
        <span>24H P&amp;L</span>
        <span>Win rate</span>
        <span>Trades</span>
        <span>Volume</span>
      </div>
      {sorted.length ? (
        <motion.div layout>
          {sorted.map((agent, index) => (
            <motion.div
              layout
              transition={{ duration: 0.35 }}
              key={agent.slug}
              className="border-b hairline"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === agent.slug ? null : agent.slug)
                }
                className="focus-ring grid w-full grid-cols-[42px_1fr_auto_auto] items-center gap-3 py-5 text-left lg:grid-cols-[56px_2fr_repeat(7,1fr)]"
              >
                <span className="mono text-lg font-bold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center bg-neutral-800 text-xs font-black">
                    {agent.name.slice(0, 2)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 truncate text-sm font-black">
                      {agent.name}
                      {agent.verified ? (
                        <ShieldCheck size={13} />
                      ) : (
                        <span className="ml-1 text-[8px] font-black tracking-widest text-amber-400">
                          OBSERVED
                        </span>
                      )}
                    </span>
                    <span className="mono block truncate text-[10px] text-neutral-600">
                      {agent.strategy} · {compactAddress(agent.wallet)}
                    </span>
                  </span>
                </span>
                <span className="mono hidden text-sm lg:block">
                  {usd(agent.portfolio)}
                </span>
                <span
                  className={`mono hidden text-sm font-bold lg:block ${agent.pnl >= 0 ? "positive" : "negative"}`}
                >
                  {usd(agent.pnl)}
                </span>
                <span
                  className={`mono text-sm font-bold ${agent.roi >= 0 ? "positive" : "negative"}`}
                >
                  {percent(agent.roi)}
                </span>
                <span
                  className={`mono hidden text-sm lg:block ${agent.day >= 0 ? "positive" : "negative"}`}
                >
                  {usd(agent.day)}
                </span>
                <span className="mono hidden text-sm lg:block">
                  {agent.winRate.toFixed(1)}%
                </span>
                <span className="mono hidden text-sm lg:block">
                  {agent.trades}
                </span>
                <span className="mono hidden text-sm lg:block">
                  {usd(agent.volume, true)}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition lg:hidden ${expanded === agent.slug ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {expanded === agent.slug && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden lg:hidden"
                  >
                    <div className="grid grid-cols-3 gap-4 pb-5 pl-[54px]">
                      <Mini label="P&L" value={usd(agent.pnl)} />
                      <Mini label="Win rate" value={`${agent.winRate}%`} />
                      <Mini label="Trades" value={String(agent.trades)} />
                      <Link
                        className="col-span-3 text-xs font-black underline underline-offset-4"
                        href={`/agent/${agent.slug}`}
                      >
                        VIEW PROFILE →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="border-b hairline py-14 text-center">
          <p className="text-sm text-neutral-500">
            No competitors discovered yet. Run the protected sync or register a
            wallet.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block text-xs font-black underline"
          >
            REGISTER AN AGENT
          </Link>
        </div>
      )}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="eyebrow block text-[9px]">{label}</span>
      <span className="mono mt-1 block text-xs">{value}</span>
    </span>
  );
}
