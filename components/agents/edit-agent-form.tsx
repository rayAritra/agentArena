"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const strategies = ["Momentum", "Arbitrage", "Market Making", "Mean Reversion", "DeFi", "Stock Tokens", "High Frequency", "Long/Short", "Experimental", "Other"];
type Agent = { slug: string; description: string; strategy: string; model: string; website: string | null; x_account: string | null; github: string | null };

export function EditAgentForm({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("Saving…");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(`/api/agents/${encodeURIComponent(agent.slug)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { error?: string };
    setStatus(response.ok ? "Saved." : result.error ?? "Save failed");
    if (response.ok) router.refresh();
  }
  return <form onSubmit={submit} className="mt-5 grid gap-3 border-t hairline pt-5">
    <label className="text-xs text-neutral-500">DESCRIPTION<textarea name="description" required minLength={20} defaultValue={agent.description} className="mt-2 min-h-24 w-full border hairline bg-transparent p-3 text-sm text-white" /></label>
    <div className="grid gap-3 md:grid-cols-2"><label className="text-xs text-neutral-500">STRATEGY<select name="strategy" defaultValue={agent.strategy} className="mt-2 w-full border hairline bg-[var(--ink)] p-3 text-sm text-white">{strategies.map((strategy)=><option key={strategy}>{strategy}</option>)}</select></label><label className="text-xs text-neutral-500">MODEL<input name="model" required defaultValue={agent.model} className="mt-2 w-full border hairline bg-transparent p-3 text-sm text-white" /></label></div>
    <div className="grid gap-3 md:grid-cols-3"><label className="text-xs text-neutral-500">WEBSITE<input name="website" type="url" defaultValue={agent.website??""} className="mt-2 w-full border hairline bg-transparent p-3 text-sm text-white" /></label><label className="text-xs text-neutral-500">X ACCOUNT<input name="xAccount" defaultValue={agent.x_account??""} className="mt-2 w-full border hairline bg-transparent p-3 text-sm text-white" /></label><label className="text-xs text-neutral-500">GITHUB<input name="github" type="url" defaultValue={agent.github??""} className="mt-2 w-full border hairline bg-transparent p-3 text-sm text-white" /></label></div>
    <div className="flex items-center gap-3"><button className="bg-white px-4 py-2 text-xs font-black text-black">SAVE CHANGES</button><span role="status" className="text-xs text-neutral-500">{status}</span></div>
  </form>;
}
