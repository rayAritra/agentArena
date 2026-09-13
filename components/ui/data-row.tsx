import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "brand" | "accent" | "positive" | "negative" | "neutral";

const toneClass: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  neutral: "bg-surface text-muted",
};

export function DataRow({
  icon,
  iconTone = "brand",
  title,
  subtitle,
  trailing,
  trailingSub,
  href,
  external,
}: {
  icon?: ReactNode;
  iconTone?: Tone;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  trailingSub?: ReactNode;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      {icon && (
        <span className={`mono grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-black ${toneClass[iconTone]}`}>{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black">{title}</span>
        {subtitle && <span className="mono mt-0.5 block truncate text-xs text-muted">{subtitle}</span>}
      </span>
      {(trailing || trailingSub) && (
        <span className="shrink-0 text-right">
          {trailing && <span className="mono block text-sm font-bold">{trailing}</span>}
          {trailingSub && <span className="mono mt-0.5 block text-xs text-muted">{trailingSub}</span>}
        </span>
      )}
    </>
  );
  const className = "flex min-w-0 items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5 transition hover:bg-surface";

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
