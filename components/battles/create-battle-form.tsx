"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Swords } from "lucide-react";
import type { Agent } from "@/lib/demo/data";

export function CreateBattleForm({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [first, setFirst] = useState(agents[0]?.slug ?? "");
  const [second, setSecond] = useState(agents[1]?.slug ?? "");
  const [duration, setDuration] = useState("24h");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function createBattle() {
    if (!first || !second || first === second) {
      setMessage("Choose two different competitors.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/battles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${agents.find((agent) => agent.slug === first)?.name ?? "Agent"} vs ${agents.find((agent) => agent.slug === second)?.name ?? "Agent"}`,
          description: "Live onchain performance from the battle-start baseline.",
          agents: [first, second],
          duration,
          scoringMode: "total_return",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Sign in to create a battle. Viewing remains public." : (payload.error?.message ?? "Battle creation failed."));
      router.push(`/battle/${payload.data.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Battle creation failed.");
    } finally {
      setPending(false);
    }
  }

  if (agents.length < 2) {
    return <p className="card mt-8 py-6 text-center text-sm text-muted">At least two discovered or verified competitors are required.</p>;
  }

  return (
    <section className="card mt-8 p-5 md:p-7" aria-labelledby="create-battle">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <span className="eyebrow">New competition</span>
          <h2 id="create-battle" className="mt-2 text-xl font-black">Start a live battle</h2>
        </div>
        <BattleSelect label="Competitor A" value={first} onChange={setFirst} agents={agents} />
        <BattleSelect label="Competitor B" value={second} onChange={setSecond} agents={agents} />
        <label className="grid gap-2">
          <span className="eyebrow">Duration</span>
          <select className="field w-auto" value={duration} onChange={(event) => setDuration(event.target.value)}>
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>
        <button className="btn btn-primary" disabled={pending} onClick={createBattle}>
          <Swords size={14} /> {pending ? "Starting…" : "Start battle"}
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">Performance starts at zero from a captured live portfolio baseline. Observed wallets remain explicitly unverified.</p>
      {message && <p className="mt-3 text-sm text-warning" role="status">{message}</p>}
    </section>
  );
}

function BattleSelect({ label, value, onChange, agents }: { label: string; value: string; onChange: (value: string) => void; agents: Agent[] }) {
  return (
    <label className="grid gap-2">
      <span className="eyebrow">{label}</span>
      <select className="field w-auto max-w-52" value={value} onChange={(event) => onChange(event.target.value)}>
        {agents.map((agent) => (
          <option value={agent.slug} key={agent.slug}>
            {agent.name}{agent.verified ? " · verified" : " · observed"}
          </option>
        ))}
      </select>
    </label>
  );
}
