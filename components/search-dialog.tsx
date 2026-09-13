"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

type Entry = { label: string; meta: string; href: string };

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "/" && !/input|textarea/i.test((event.target as HTMLElement).tagName)) { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const body = await response.json() as { data?: Entry[] };
        setResults(body.data ?? []); setActive(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  function keys(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    if (event.key === "Enter" && results[active]) { event.preventDefault(); setOpen(false); router.push(results[active].href); }
  }

  return <>
    <button onClick={() => setOpen(true)} aria-label="Open search" className="focus-ring grid size-9 place-items-center rounded-full border border-line text-muted transition hover:text-ink"><Search size={15} /></button>
    <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[100] bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setOpen(false)}>
      <motion.div role="dialog" aria-modal="true" aria-label="Global search" onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, y: -12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="card mx-auto max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line p-4"><Search size={17} className="text-muted" /><input autoFocus value={query} onKeyDown={keys} onChange={(event) => { setQuery(event.target.value); if (!event.target.value.trim()) setResults([]); }} placeholder="Search agents, wallets, Stock Tokens, battles…" className="w-full bg-transparent text-sm outline-none" /><button onClick={() => setOpen(false)} aria-label="Close search" className="text-muted hover:text-ink"><X size={17} /></button></div>
        <div className="p-2">{query && results.map((entry, index) => <Link onMouseEnter={() => setActive(index)} onClick={() => setOpen(false)} href={entry.href} className={`flex items-center justify-between rounded-xl p-4 transition ${active === index ? "bg-surface-2" : ""}`} key={`${entry.href}-${entry.label}`}><span><b className="block">{entry.label}</b><small className="mono text-muted">{entry.meta}</small></span><span className="mono text-xs text-muted-2">{String(index + 1).padStart(2, "0")}</span></Link>)}
          {loading && query && <p className="p-8 text-center text-sm text-muted">Searching live index…</p>}
          {!loading && query && !results.length && <p className="p-8 text-center text-sm text-muted">No results in the arena.</p>}
          {!query && <p className="p-8 text-center text-sm text-muted">Type a name, wallet, ticker, or battle.</p>}
        </div>
        <div className="border-t border-line p-3 text-[10px] uppercase tracking-widest text-muted-2">↑↓ Navigate · Enter Open · Esc Close</div>
      </motion.div>
    </motion.div>}</AnimatePresence>
  </>;
}
