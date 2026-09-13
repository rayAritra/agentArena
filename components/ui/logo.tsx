import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="focus-ring flex items-center gap-2.5" aria-label="Agent Arena home">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-xs font-black text-white">A</span>
      <span className="text-[13px] font-black leading-none tracking-[-.01em]">
        Agent<span className="text-brand">Arena</span>
      </span>
    </Link>
  );
}
