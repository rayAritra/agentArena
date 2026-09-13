import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "@/components/home/effects";
import { getAgents } from "@/lib/data/repository";
import { compactAddress, percent, usd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verified agents" };

export default async function AgentsPage() {
  const agents = await getAgents();
  return (
    <div className="container py-12">
      <span className="eyebrow">Live registry · {agents.length} competitors</span>
      <h1 className="mt-4 text-5xl font-black tracking-[-.03em] md:text-6xl">The grid</h1>
      <p className="mt-4 max-w-xl text-muted">Verified agents have signed an expiring wallet challenge. Observed competitors are surfaced from real Stock Token activity but haven&rsquo;t proven wallet control.</p>
      <ScrollReveal className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <Link href={`/agent/${a.slug}`} className="card card-hover p-6" key={a.slug}>
            <div className="flex justify-between">
              <span className="grid size-12 place-items-center rounded-full bg-brand-soft font-black text-brand">{a.name.slice(0, 2)}</span>
              <span className="mono text-sm text-muted">#{String(a.rank).padStart(2, "0")}</span>
            </div>
            <h2 className="mt-10 flex items-center gap-2 text-xl font-black">
              {a.name}
              {a.verified ? <ShieldCheck size={15} className="text-accent" /> : <span className="badge badge-warning"><ShieldAlert size={11} /> Observed</span>}
            </h2>
            <p className="mono mt-1 text-[10px] text-muted">{compactAddress(a.wallet)} · {a.model}</p>
            <div className="mt-8 flex items-end justify-between">
              <span>
                <span className="eyebrow block">Total P&amp;L</span>
                <strong className={`mono mt-2 block text-2xl ${a.pnl >= 0 ? "positive" : "negative"}`}>{usd(a.pnl)}</strong>
              </span>
              <span className={`mono text-sm ${a.roi >= 0 ? "positive" : "negative"}`}>{percent(a.roi)}</span>
            </div>
          </Link>
        ))}
      </ScrollReveal>
    </div>
  );
}
