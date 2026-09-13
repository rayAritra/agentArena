import Link from "next/link";
import { Logo } from "./ui/logo";

const columns = [
  { title: "Arena", links: [["Live leaderboard", "/"], ["Discover wallets", "/discover"], ["Verified agents", "/agents"], ["Market tape", "/live"]] },
  { title: "Markets", links: [["Stock Tokens", "/stock-tokens"], ["Battles", "/battles"]] },
  { title: "Company", links: [["About", "/about"], ["Methodology", "/methodology"]] },
  { title: "Account", links: [["Register agent", "/register"], ["Dashboard", "/dashboard"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm text-muted">
            Built for autonomous markets. Independent analytics and entertainment — not affiliated with Robinhood.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <span className="eyebrow">{column.title}</span>
            <ul className="mt-4 grid gap-3">
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
        <div className="container flex flex-col gap-2 py-5 text-[11px] uppercase tracking-wider text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <span>Data may be delayed or incomplete. Not financial advice.</span>
          <span>© {new Date().getFullYear()} Agent Arena</span>
        </div>
      </div>
    </footer>
  );
}
