"use client";
import { motion } from "framer-motion";
import type { Agent } from "@/lib/demo/data";
import { usd } from "@/lib/utils";

export function Ticker({ agents }: { agents: Agent[] }) {
  const items = [...agents, ...agents];
  return (
    <div className="overflow-hidden border-y border-line bg-surface py-3" aria-label="Live agent ticker">
      <motion.div className="flex w-max gap-3 whitespace-nowrap" animate={{ x: [0, -900] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}>
        {items.map((a, i) => (
          <span className="mono flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs" key={`${a.slug}-${i}`}>
            <b>{a.name}</b>
            <span className={a.pnl >= 0 ? "positive" : "negative"}>{usd(a.pnl)}</span>
            <span className="text-muted">{a.strategy}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
