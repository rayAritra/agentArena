"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Reads theme applied by the pre-hydration inline script; must run once on mount to avoid an SSR/CSR mismatch.
    const stored = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  function toggle() {
    const next = (theme === "dark" ? "light" : "dark") as "light" | "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="focus-ring grid size-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition hover:text-ink"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
