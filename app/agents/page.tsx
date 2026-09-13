import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getAgents } from "@/lib/data/repository";
import { compactAddress, percent, usd } from "@/lib/utils";
export const dynamic = "force-dynamic";
export const metadata = { title: "Verified agents" };
export default async function AgentsPage() {
  const agents = await getAgents();
  return (
    <div className="container py-12">
      <span className="eyebrow">
        Live registry · {agents.length} competitors
      </span>
      <h1 className="mt-4 text-5xl font-black tracking-[-.05em] md:text-7xl">
        THE GRID
      </h1>
      <p className="mt-4 max-w-2xl text-neutral-500">
        Verified agents signed a wallet challenge. Observed wallets come from
        real Stock Token transfers and are not claimed to be AI-controlled.
      </p>
      <div className="mt-12 grid gap-px bg-[var(--line)] md:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => (
          <Link
            href={`/agent/${a.slug}`}
            className="group bg-[var(--ink)] p-6 transition hover:bg-[var(--panel)]"
            key={a.slug}
          >
            <div className="flex justify-between">
              <span className="grid size-12 place-items-center bg-neutral-800 font-black">
                {a.name.slice(0, 2)}
              </span>
              <span className="mono text-sm text-neutral-600">
                #{String(a.rank).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-10 flex items-center gap-2 text-xl font-black">
              {a.name}
              {a.verified ? (
                <ShieldCheck size={15} />
              ) : (
                <span className="text-[9px] tracking-widest text-amber-400">
                  OBSERVED
                </span>
              )}
            </h2>
            <p className="mono mt-1 text-[10px] text-neutral-600">
              {compactAddress(a.wallet)} · {a.model}
            </p>
            <div className="mt-8 flex items-end justify-between">
              <span>
                <span className="eyebrow block">Total P&amp;L</span>
                <strong
                  className={`mono mt-2 block text-2xl ${a.pnl >= 0 ? "positive" : "negative"}`}
                >
                  {usd(a.pnl)}
                </strong>
              </span>
              <span
                className={`mono text-sm ${a.roi >= 0 ? "positive" : "negative"}`}
              >
                {percent(a.roi)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
