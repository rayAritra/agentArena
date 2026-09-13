"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const dotTop = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="pointer-events-none fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex" aria-hidden>
      <span className="text-[9px] font-black uppercase tracking-[.25em] text-muted-2 [writing-mode:vertical-rl]">Market pulse</span>
      <div className="relative h-44 w-px bg-line">
        <motion.div className="absolute inset-x-0 top-0 w-px origin-top bg-gradient-to-b from-accent to-brand" style={{ scaleY: progress, height: "100%" }} />
        <motion.span className="absolute -left-[3px] size-[7px] -translate-y-1/2 rounded-full bg-brand shadow-[0_0_10px_var(--brand)]" style={{ top: dotTop }} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-[.25em] text-muted-2 [writing-mode:vertical-rl]">End</span>
    </div>
  );
}
