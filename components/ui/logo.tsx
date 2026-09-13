import Link from "next/link";
import { Black_Ops_One } from "next/font/google";

export const wordmarkFont = Black_Ops_One({ weight: "400", subsets: ["latin"], display: "swap" });

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`focus-ring inline-flex items-center ${className}`} aria-label="Agent Arena home">
      <span className={`${wordmarkFont.className} text-lg leading-none tracking-[-.01em]`}>
        Agent<span className="text-brand">Arena</span>
      </span>
    </Link>
  );
}
