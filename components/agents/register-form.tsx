"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Wallet } from "lucide-react";
import { ScrollReveal } from "@/components/home/effects";
import { authClient } from "@/lib/auth/client";

const strategies = ["Momentum", "Arbitrage", "Market Making", "Mean Reversion", "DeFi", "Stock Tokens", "High Frequency", "Long/Short", "Experimental", "Other"];
type EthereumProvider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };
declare global { interface Window { ethereum?: EthereumProvider } }

export function RegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [wallet, setWallet] = useState("");

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const intent = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    setStatus(intent === "signup" ? "Creating your secure owner account…" : "Signing in…");
    try {
      const result = intent === "signup"
        ? await authClient.signUp.email({ email, password, name: email.split("@")[0] || "Agent owner" })
        : await authClient.signIn.email({ email, password });
      setStatus(result.error ? result.error.message ?? "Authentication failed" : intent === "signup" ? "Account created. You can now register your agent." : "Signed in. You can now register your agent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed");
    }
  }

  async function connect() {
    if (!window.ethereum) { setStatus("Install an EVM-compatible browser wallet."); return; }
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1237" }] });
    } catch (error) {
      if ((error as { code?: number }).code !== 4902) { setStatus("Switch your wallet to Robinhood Chain (4663)."); return; }
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x1237", chainName: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"], blockExplorerUrls: ["https://robinhoodchain.blockscout.com"] }] });
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
    setWallet(accounts[0]?.toLowerCase() ?? "");
    setStatus(accounts[0] ? "Wallet connected. No transaction was initiated." : "No wallet selected.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet) { setStatus("Connect the agent wallet first."); return; }
    const session = await authClient.getSession();
    if (!session.data?.user) { setStatus("Sign in before registering."); return; }
    setStatus("Registering agent…");
    const form = new FormData(event.currentTarget);
    const registration = await fetch("/api/agents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form), wallet }) });
    const registrationData = await registration.json() as { data?: { id: string }; error?: string };
    if (!registration.ok || !registrationData.data) { setStatus(registrationData.error ?? "Registration failed"); return; }
    setStatus("Requesting one-time wallet challenge…");
    const nonceResponse = await fetch("/api/agents/verification/nonce", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: wallet }) });
    const challenge = await nonceResponse.json() as { id?: string; message?: string; error?: string };
    if (!nonceResponse.ok || !challenge.id || !challenge.message) { setStatus(challenge.error ?? "Challenge failed"); return; }
    try {
      const signature = await window.ethereum!.request({ method: "personal_sign", params: [challenge.message, wallet] }) as string;
      const confirmation = await fetch("/api/agents/verification/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agentId: registrationData.data.id, address: wallet, nonceId: challenge.id, message: challenge.message, signature }) });
      const result = await confirmation.json() as { error?: string };
      setStatus(confirmation.ok ? "Verified. Opening your dashboard…" : result.error ?? "Verification failed");
      if (confirmation.ok) { router.push("/dashboard"); router.refresh(); }
    } catch { setStatus("Signature request was rejected. You can retry verification later."); }
  }

  return <ScrollReveal className="mt-10 grid gap-8">
    <form onSubmit={authenticate} className="card p-5">
      <span className="eyebrow">1 · Owner authentication</span>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto_auto]">
        <input name="email" type="email" required placeholder="you@example.com" className="field min-w-0" />
        <input name="password" type="password" minLength={8} required placeholder="Password (8+ characters)" className="field min-w-0" />
        <button name="intent" value="signin" className="btn btn-outline"><LogIn size={14} /> Sign in</button>
        <button name="intent" value="signup" className="btn btn-primary"><UserPlus size={14} /> Create</button>
      </div>
    </form>
    <form onSubmit={submit} className="card grid gap-5 p-5 md:p-7">
      <div className="flex items-center justify-between"><span className="eyebrow">2 · Agent and wallet</span><button type="button" onClick={connect} className="btn btn-outline btn-sm"><Wallet size={14} />{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</button></div>
      <Field name="name" label="Agent name" />
      <label><span className="eyebrow">Description</span><textarea name="description" required minLength={20} className="field mt-2 min-h-28" /></label>
      <div className="grid gap-5 sm:grid-cols-2"><label><span className="eyebrow">Strategy</span><select name="strategy" className="field mt-2">{strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}</select></label><Field name="model" label="AI model" /></div>
      <div className="grid gap-5 sm:grid-cols-3"><Field name="website" label="Website (optional)" type="url" /><Field name="xAccount" label="X account (optional)" /><Field name="github" label="GitHub (optional)" type="url" /></div>
      <Field name="startingCapital" label="Starting capital (USD)" type="number" />
      <button className="btn btn-primary mt-2 justify-center py-4"><Wallet size={15} /> Register &amp; verify wallet</button>
      <p className="min-h-5 text-center text-xs text-muted" role="status">{status}</p>
    </form>
  </ScrollReveal>;
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return <label><span className="eyebrow">{label}</span><input name={name} type={type} required={!label.includes("optional")} className="field mt-2" /></label>;
}
