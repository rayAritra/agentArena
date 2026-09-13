"use client";

import { useEffect, useRef } from "react";

type Vec = { x: number; y: number };
type Node = Vec & { vx: number; vy: number; r: number; activation: number };
type Edge = { a: number; b: number; lit: number };
type Pulse = {
  from: Vec;
  to: Vec;
  toNode: number;
  progress: number;
  speed: number;
  kind: "in" | "out";
  color: string;
  rejected: boolean;
  rejectedAt: number | null;
};
type Chart = { points: Vec[]; opacity: number };
type Phase = "observe" | "analyze" | "decide" | "execute";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
function hexAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

export function NetworkHeroCanvas({
  className = "",
  coreX = 0.72,
  coreY = 0.46,
  dimEnd = 0.55,
}: {
  className?: string;
  /** core x position as a fraction of width (0 = left edge, 1 = right edge) */
  coreX?: number;
  /** core y position as a fraction of height */
  coreY?: number;
  /** fraction of width, from the left edge, over which the network fades in */
  dimEnd?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapEl = wrapRef.current;
    const canvasEl = canvasRef.current;
    if (!wrapEl || !canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;

    const wrap: HTMLDivElement = wrapEl;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue("--brand").trim() || "#e31c56";
    const positive = style.getPropertyValue("--positive").trim() || "#34d399";
    const negative = style.getPropertyValue("--negative").trim() || "#ff5a46";

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let core: Vec = { x: 0, y: 0 };
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let pulses: Pulse[] = [];
    let charts: Chart[] = [];
    let mouse = { x: -9999, y: -9999 };
    let mouseTarget = { x: 0, y: 0 };
    const parallax = { x: 0, y: 0 };
    let ringBurst = 0;
    let phase: Phase = "observe";
    let phaseTimer = 0;
    let phaseDwell = 3200;
    let activeTarget = -1;
    let lastSpawn = 0;
    let raf = 0;
    let last = performance.now();

    function buildNetwork() {
      const count = Math.round(Math.min(130, Math.max(60, (w * h) / 7000)));
      core = { x: w * coreX, y: h * coreY };
      nodes = [{ x: core.x, y: core.y, vx: 0, vy: 0, r: 3.2, activation: 0.5 }];
      for (let i = 1; i < count; i++) {
        nodes.push({
          x: rand(w * 0.02, w * 0.98),
          y: rand(h * 0.08, h * 0.94),
          vx: rand(-0.012, 0.012),
          vy: rand(-0.012, 0.012),
          r: rand(1, 2.4),
          activation: 0,
        });
      }
      edges = [];
      const seen = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const dists: [number, number][] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue;
          dists.push([Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y), j]);
        }
        dists.sort((a, b) => a[0] - b[0]);
        const k = i === 0 ? 8 : Math.random() < 0.4 ? 2 : Math.random() < 0.75 ? 3 : 4;
        for (let n = 0; n < k && n < dists.length; n++) {
          const j = dists[n][1];
          const key = i < j ? `${i}:${j}` : `${j}:${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({ a: Math.min(i, j), b: Math.max(i, j), lit: 0 });
          }
        }
      }
      charts = Array.from({ length: 3 }, () => makeChart());
    }

    function makeChart(): Chart {
      const points: Vec[] = [];
      let x = rand(-w * 0.3, 0);
      let py = rand(h * 0.15, h * 0.85);
      while (x < w * 1.3) {
        py += rand(-14, 14);
        points.push({ x, y: py });
        x += rand(24, 48);
      }
      return { points, opacity: rand(0.02, 0.05) };
    }

    function neighborsOf(idx: number) {
      return edges.filter((e) => e.a === idx || e.b === idx).map((e) => (e.a === idx ? e.b : e.a));
    }
    function randomOuter() {
      return 1 + Math.floor(Math.random() * (nodes.length - 1));
    }

    function spawnPulse(fromIdx: number, toIdx: number, kind: Pulse["kind"], color: string) {
      const a = nodes[fromIdx], b = nodes[toIdx];
      if (!a || !b) return;
      pulses.push({
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        toNode: toIdx,
        progress: 0,
        speed: kind === "out" ? rand(0.55, 0.75) : rand(0.28, 0.46),
        kind,
        color,
        rejected: kind === "in" && Math.random() < 0.22,
        rejectedAt: null,
      });
    }

    function transition() {
      const weights: Record<Phase, [Phase, number][]> = {
        observe: [["observe", 0.42], ["analyze", 0.5], ["decide", 0.08]],
        analyze: [["observe", 0.22], ["analyze", 0.32], ["decide", 0.46]],
        decide: [["execute", 1]],
        execute: [["observe", 0.75], ["analyze", 0.25]],
      };
      const options = weights[phase];
      const r = Math.random();
      let acc = 0, next: Phase = phase;
      for (const [name, wgt] of options) {
        acc += wgt;
        if (r <= acc) {
          next = name;
          break;
        }
      }
      phase = next;
      phaseTimer = 0;
      const dwellBase: Record<Phase, number> = { observe: 3400, analyze: 2600, decide: 700, execute: 1000 };
      phaseDwell = dwellBase[phase] * rand(0.6, 1.5);

      if (phase === "decide") {
        const picks = new Set<number>();
        const target = 5 + Math.floor(Math.random() * 6);
        while (picks.size < target && picks.size < nodes.length - 1) picks.add(randomOuter());
        for (const idx of picks) spawnPulse(idx, 0, "in", accent);
        activeTarget = picks.size ? pick(Array.from(picks)) : randomOuter();
        nodes[0].activation = Math.min(1, nodes[0].activation + 0.3);
      }
      if (phase === "execute") {
        if (activeTarget < 0) activeTarget = randomOuter();
        spawnPulse(0, activeTarget, "out", positive);
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) spawnPulse(0, randomOuter(), "out", accent);
        ringBurst = 1;
        activeTarget = -1;
      }
    }

    function step(dt: number) {
      phaseTimer += dt;
      if (phaseTimer > phaseDwell) transition();

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * dt * 0.06;
        n.y += n.vy * dt * 0.06;
        n.activation = Math.max(0, n.activation - dt * 0.0006);
      }
      for (const e of edges) e.lit = Math.max(0, e.lit - dt * 0.0012);
      ringBurst = Math.max(0, ringBurst - dt * 0.0015);

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (d < 140) n.activation = Math.min(1, n.activation + (1 - d / 140) * 0.12);
      }

      lastSpawn += dt;
      const spawnInterval = phase === "observe" ? rand(400, 800) : phase === "analyze" ? rand(200, 420) : Infinity;
      if (phase !== "decide" && phase !== "execute" && lastSpawn > spawnInterval) {
        lastSpawn = 0;
        const burst = phase === "analyze" ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < burst; i++) spawnPulse(randomOuter(), 0, "in", accent);
        if (phase === "analyze") {
          for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
            const a = randomOuter(), b = randomOuter();
            const edge = edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
            if (edge) edge.lit = 1;
          }
          nodes[0].activation = Math.min(1, nodes[0].activation + 0.05);
        }
      }

      for (const p of pulses) {
        p.progress += dt * 0.001 * p.speed;
        if (p.kind === "in" && p.rejected && p.rejectedAt === null && p.progress > 0.6) {
          p.rejectedAt = p.progress;
          const neighbors = neighborsOf(p.toNode).filter((n) => n !== 0);
          const alt = neighbors.length ? pick(neighbors) : randomOuter();
          const target = nodes[alt];
          if (target) p.to = { x: target.x, y: target.y };
          p.color = negative;
        }
        if (p.progress >= 1) {
          if (p.kind === "in" && !p.rejected) {
            nodes[0].activation = Math.min(1, nodes[0].activation + 0.16);
            ringBurst = Math.min(1, ringBurst + 0.25);
          }
          if (p.kind === "out") {
            const target = nodes[p.toNode];
            if (target) target.activation = 1;
            ringBurst = 1;
          }
        }
      }
      pulses = pulses.filter((p) => p.progress < 1.05);

      parallax.x += (mouseTarget.x - parallax.x) * 0.04;
      parallax.y += (mouseTarget.y - parallax.y) * 0.04;
    }

    function leftFactor(x: number) {
      const t = Math.max(0, Math.min(1, x / (w * dimEnd)));
      const eased = t * t * (3 - 2 * t);
      return 0.08 + 0.92 * eased;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08090b";
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, Math.min(w, h) * 0.55);
      glow.addColorStop(0, hexAlpha(accent, 0.1 + ringBurst * 0.05));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 1;
      for (const chart of charts) {
        ctx.beginPath();
        chart.points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.strokeStyle = `rgba(255,255,255,${chart.opacity})`;
        ctx.stroke();
      }

      for (let i = 0; i < 3; i++) {
        const r = Math.min(w, h) * (0.3 + i * 0.09);
        ctx.beginPath();
        ctx.arc(core.x, core.y, r, 0, Math.PI * 2);
        const alpha = 0.025 + (phase === "decide" || phase === "execute" ? 0.03 : 0) + ringBurst * 0.02;
        ctx.strokeStyle = `rgba(255,90,70,${alpha})`;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(parallax.x, parallax.y);

      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b];
        const f = leftFactor((a.x + b.x) / 2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const base = 0.045;
        ctx.strokeStyle = e.lit > 0 ? hexAlpha(accent, (base + e.lit * 0.35) * f) : `rgba(255,255,255,${base * f})`;
        ctx.lineWidth = e.lit > 0 ? 1 : 0.6;
        ctx.stroke();
      }

      for (let i = 1; i < nodes.length; i++) {
        const n = nodes[i];
        const f = leftFactor(n.x);
        const alpha = (0.16 + n.activation * 0.7) * f;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + n.activation * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = n.activation > 0.4 ? hexAlpha(accent, alpha) : `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      for (const p of pulses) {
        const prog = easeInOut(Math.min(p.progress, 1));
        const x = p.from.x + (p.to.x - p.from.x) * prog;
        const y = p.from.y + (p.to.y - p.from.y) * prog;
        const tailProg = Math.max(0, prog - 0.08);
        const tx = p.from.x + (p.to.x - p.from.x) * tailProg;
        const ty = p.from.y + (p.to.y - p.from.y) * tailProg;
        const f = leftFactor(x);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.strokeStyle = hexAlpha(p.color, 0.5 * f);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, p.kind === "out" ? 2.2 : 1.7, 0, Math.PI * 2);
        ctx.fillStyle = hexAlpha(p.color, 0.9 * f);
        ctx.fill();
        if (p.rejectedAt !== null && p.progress - p.rejectedAt < 0.06) {
          ctx.font = "10px monospace";
          ctx.fillStyle = hexAlpha(negative, 0.7 * f);
          ctx.fillText("×", x + 4, y - 4);
        }
      }

      const t = performance.now() * 0.001;
      for (let i = 0; i < 3; i++) {
        const cyc = (t * 0.09 + i / 3) % 1;
        const radius = 10 + cyc * 46 + ringBurst * 30;
        const alpha = (1 - cyc) * 0.16 + ringBurst * 0.12;
        ctx.beginPath();
        ctx.arc(core.x, core.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = hexAlpha(accent, Math.max(0, alpha));
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(core.x, core.y, 3 + nodes[0].activation * 2 + ringBurst * 2, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(accent, 0.85 + ringBurst * 0.15);
      ctx.fill();

      ctx.restore();
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      buildNetwork();
      if (reduceMotion) draw();
    }

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      const nx = Math.max(-1, Math.min(1, (mouse.x - w / 2) / (w / 2)));
      const ny = Math.max(-1, Math.min(1, (mouse.y - h / 2) / (h / 2)));
      mouseTarget = { x: nx * 8, y: ny * 6 };
    }
    function onLeave() {
      mouse = { x: -9999, y: -9999 };
      mouseTarget = { x: 0, y: 0 };
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();

    if (!reduceMotion) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      function animate(now: number) {
        const dt = Math.min(48, now - last);
        last = now;
        step(dt);
        draw();
        raf = requestAnimationFrame(animate);
      }
      raf = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [coreX, coreY, dimEnd]);

  return (
    <div ref={wrapRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
