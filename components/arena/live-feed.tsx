"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ArenaEvent } from "@/lib/data/events";
import { usd } from "@/lib/utils";

const labels: Record<string, string> = {
  agent_trade_buy: "bought",
  agent_trade_sell: "sold",
  agent_large_win: "recorded a large win",
  agent_large_loss: "recorded a large loss",
  agent_rank_changed: "changed rank",
  battle_started: "started a battle",
  battle_finished: "finished a battle",
};

export function LiveFeed({ initial }: { initial: ArenaEvent[] }) {
  const [events, setEvents] = useState(initial);
  const [paused, setPaused] = useState(false);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    if (paused) return;
    const source = new EventSource("/api/v1/events/stream");
    source.onopen = () => setStatus("live");
    source.addEventListener("arena", (event) => {
      const incoming = JSON.parse((event as MessageEvent).data) as ArenaEvent;
      setEvents((current) => [incoming, ...current.filter((x) => x.id !== incoming.id)].slice(0, 100));
    });
    source.onerror = () => setStatus("reconnecting");
    return () => source.close();
  }, [paused]);

  const visible = useMemo(() => (type === "all" ? events : events.filter((x) => x.type === type)), [events, type]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button className="btn btn-outline btn-sm" onClick={() => setPaused((x) => !x)}>
          {paused ? "Resume" : "Pause"}
        </button>
        <select aria-label="Event type" className="field w-auto text-xs" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All events</option>
          <option value="agent_trade_buy">Buys</option>
          <option value="agent_trade_sell">Sells</option>
          <option value="agent_rank_changed">Rank changes</option>
        </select>
        <span className={`badge ${status === "live" && !paused ? "badge-positive badge-dot badge-live" : "badge-warning badge-dot"}`}>{paused ? "Paused" : status}</span>
      </div>
      <div className="mt-6 grid min-h-[420px] gap-3">
        <AnimatePresence initial={false}>
          {visible.map((event) => {
            const value = Number(event.metadata.valueUsd ?? 0);
            const symbol = String(event.metadata.symbol ?? "");
            const positive = event.severity !== "critical";
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
                key={event.id}
              >
                <Link
                  href={event.slug ? `/agent/${event.slug}` : "#"}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 transition hover:bg-surface"
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${positive ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"}`}>
                    {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      <b>{event.agent ?? "Arena"}</b> <span className="text-muted">{labels[event.type] ?? event.type.replaceAll("_", " ")}</span> {symbol && <b>{symbol}</b>}
                    </span>
                    <span className="eyebrow mt-0.5 block">{new Date(event.timestamp).toLocaleString("en-US", { timeZone: "UTC" })} UTC</span>
                  </span>
                  {!!value && <span className={`mono shrink-0 text-sm font-bold ${event.severity === "critical" ? "negative" : "positive"}`}>{usd(value)}</span>}
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!visible.length && <p className="py-16 text-center text-sm text-muted">No matching persisted onchain events yet.</p>}
      </div>
    </>
  );
}
