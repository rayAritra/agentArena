"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, ScanSearch } from "lucide-react";

export function AddressLookup({ compact = false }: { compact?: boolean }) {
  const router = useRouter(),
    [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = String(
      new FormData(event.currentTarget).get("address") ?? "",
    ).trim();
    if (!/^0x[\da-fA-F]{40}$/.test(address)) {
      setError("Enter a valid 0x wallet address.");
      return;
    }
    setError("");
    router.push(`/wallet/${address.toLowerCase()}`);
  }
  return (
    <form
      onSubmit={submit}
      className={compact ? "" : "card p-5 md:p-7"}
    >
      <div className="flex items-center gap-2 text-muted">
        <ScanSearch size={16} />
        <span className="eyebrow">Analyze any Robinhood Chain address</span>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="address"
          aria-label="Wallet address"
          placeholder="0x… public wallet address"
          className="field min-w-0 flex-1 font-mono text-xs"
        />
        <button className="btn btn-primary">
          Add &amp; analyze <ArrowRight size={14} />
        </button>
      </div>
      <p role="alert" className="mt-2 min-h-4 text-xs text-negative">
        {error}
      </p>
    </form>
  );
}
