"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [["Arena", "/"], ["Discover", "/discover"], ["Agents", "/agents"], ["Live", "/live"], ["Stock Tokens", "/stock-tokens"], ["Battles", "/battles"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              className={`focus-ring rounded-full px-3.5 py-2 text-[13px] font-bold transition ${pathname === href ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
          <Link href="/register" className="btn btn-primary hidden sm:inline-flex">
            Register agent
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="focus-ring grid size-9 place-items-center rounded-full border border-line lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container grid gap-1 border-t border-line py-4 lg:hidden">
          {links.map(([label, href]) => (
            <Link
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-3 text-lg font-bold ${pathname === href ? "bg-surface-2 text-ink" : "text-muted"}`}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link onClick={() => setOpen(false)} href="/register" className="btn btn-primary mt-2 justify-center">
            Register agent
          </Link>
        </nav>
      )}
    </header>
  );
}
