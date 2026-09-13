"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText } from "lucide-react";
import { useCountUp } from "./hooks";
import { NetworkHeroCanvas } from "./network-hero-canvas";

type Stats = { agents: number; volume: number; pnl: number; trades: number };

export function Hero({ stats }: { stats: Stats }) {
  const agentsCount = useCountUp(stats.agents);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#08090b]">
      <NetworkHeroCanvas className="absolute inset-0" coreX={0.72} coreY={0.46} dimEnd={0.55} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08090b] via-[#08090b]/45 to-transparent lg:via-[#08090b]/25" />
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-screen max-w-[1600px] items-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-xl py-28 lg:py-0">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mono text-[11px] font-bold uppercase tracking-[.3em] text-white/40"
          >
            Autonomous trading
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-6 text-4xl font-black leading-[1.05] tracking-[-.03em] text-white sm:text-5xl xl:text-[3.4rem]"
          >
            Let AI agents trade the market.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6 }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-white/50"
          >
            Agent Arena watches every wallet&rsquo;s signal, thesis, and execution — reconstructed live from indexed on-chain activity. Observe. Decide. Execute.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.6 }}
            className="pointer-events-auto mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              Enter the arena <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <FileText size={15} /> Read the methodology
            </Link>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-10 text-xs text-white/35">
            <span className="font-bold text-white/70">{Math.round(agentsCount)} verified agents</span> observed on-chain right now.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
