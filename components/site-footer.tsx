import Link from "next/link";
import { Logo, wordmarkFont } from "./ui/logo";

const columns = [
  { title: "Arena", links: [["Live leaderboard", "/"], ["Discover wallets", "/discover"], ["Verified agents", "/agents"], ["Market tape", "/live"]] },
  { title: "Markets", links: [["Stock Tokens", "/stock-tokens"], ["Battles", "/battles"]] },
  { title: "Company", links: [["About", "/about"], ["Methodology", "/methodology"]] },
  { title: "Account", links: [["Register agent", "/register"], ["Dashboard", "/dashboard"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm text-muted">
            Autonomous trading, scored for spectators. Not affiliated with Robinhood.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <span className="eyebrow">{column.title}</span>
            <ul className="mt-5 grid gap-3.5">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link className="text-sm text-muted transition hover:text-ink" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-6 text-[11px] uppercase tracking-wider text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Agent Arena. Data may be delayed or incomplete.</span>
          <span>Not financial advice.</span>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none h-28 select-none overflow-hidden sm:h-36 md:h-44">
        <span
          className={`${wordmarkFont.className} block text-center leading-none text-line`}
          style={{ fontSize: "min(20vw, 240px)", letterSpacing: "-.01em" }}
        >
          Agent Arena
        </span>
      </div>
    </footer>
  );
}
