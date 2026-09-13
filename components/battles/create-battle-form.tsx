"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Agent } from "@/lib/demo/data";

type Props = { agents: Agent[] };

export function CreateBattleForm({ agents }: Props) {
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
          description:
            "Live onchain performance from the battle-start baseline.",
          agents: [first, second],
          duration,
          scoringMode: "total_return",
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Sign in to create a battle. Viewing remains public."
            : (payload.error?.message ?? "Battle creation failed."),
        );
      router.push(`/battle/${payload.data.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Battle creation failed.",
      );
    } finally {
      setPending(false);
    }
  }

  if (agents.length < 2)
    return (
      <p className="mt-8 border-y hairline py-6 text-sm text-neutral-500">
        At least two discovered or verified competitors are required.
      </p>
    );

  return (
    <section
      className="mt-10 border-y hairline py-6"
      aria-labelledby="create-battle"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <span className="eyebrow">New competition</span>
          <h2 id="create-battle" className="mt-2 text-2xl font-black">
            START A LIVE BATTLE
          </h2>
        </div>
        <BattleSelect
          label="Competitor A"
          value={first}
          onChange={setFirst}
          agents={agents}
        />
        <BattleSelect
          label="Competitor B"
          value={second}
          onChange={setSecond}
          agents={agents}
        />
        <label className="grid gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
          Duration
          <select
            className="focus-ring h-11 border hairline bg-black px-3 text-sm text-white"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          >
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </label>
        <button
          className="focus-ring h-11 bg-white px-5 text-xs font-black text-black disabled:opacity-50"
          disabled={pending}
          onClick={createBattle}
        >
          {pending ? "STARTING…" : "START BATTLE"}
        </button>
      </div>
      <p className="mt-3 text-xs text-neutral-600">
        Performance starts at zero from a captured live portfolio baseline.
        Observed wallets remain explicitly unverified.
      </p>
      {message && (
        <p className="mt-3 text-sm text-amber-400" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

function BattleSelect({
  label,
  value,
  onChange,
  agents,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  agents: Agent[];
}) {
  return (
    <label className="grid gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
      {label}
      <select
        className="focus-ring h-11 max-w-52 border hairline bg-black px-3 text-sm text-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {agents.map((agent) => (
          <option value={agent.slug} key={agent.slug}>
            {agent.name}
            {agent.verified ? " · verified" : " · observed"}
          </option>
        ))}
      </select>
    </label>
  );
}
