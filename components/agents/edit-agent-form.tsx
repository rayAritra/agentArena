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
  return <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-line pt-5">
    <label className="eyebrow">Description<textarea name="description" required minLength={20} defaultValue={agent.description} className="field mt-2 min-h-24 text-sm normal-case" /></label>
    <div className="grid gap-3 md:grid-cols-2"><label className="eyebrow">Strategy<select name="strategy" defaultValue={agent.strategy} className="field mt-2 text-sm normal-case">{strategies.map((strategy)=><option key={strategy}>{strategy}</option>)}</select></label><label className="eyebrow">Model<input name="model" required defaultValue={agent.model} className="field mt-2 text-sm normal-case" /></label></div>
    <div className="grid gap-3 md:grid-cols-3"><label className="eyebrow">Website<input name="website" type="url" defaultValue={agent.website??""} className="field mt-2 text-sm normal-case" /></label><label className="eyebrow">X account<input name="xAccount" defaultValue={agent.x_account??""} className="field mt-2 text-sm normal-case" /></label><label className="eyebrow">GitHub<input name="github" type="url" defaultValue={agent.github??""} className="field mt-2 text-sm normal-case" /></label></div>
    <div className="flex items-center gap-3"><button className="btn btn-primary btn-sm">Save changes</button><span role="status" className="text-xs text-muted">{status}</span></div>
  </form>;
}
