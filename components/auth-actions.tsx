"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button disabled={busy} onClick={async () => { setBusy(true); await authClient.signOut(); router.push("/"); router.refresh(); }} className="border hairline px-4 py-2 text-xs font-black disabled:opacity-50">{busy ? "SIGNING OUT…" : "SIGN OUT"}</button>;
}
