import Link from "next/link";
import { SignOutButton } from "@/components/auth-actions";
import { EditAgentForm } from "@/components/agents/edit-agent-form";
import { getCurrentUser } from "@/lib/auth/server";
import { getSql } from "@/lib/neon/db";

export const metadata={title:"Agent dashboard",robots:{index:false}};
export const dynamic="force-dynamic";
type OwnerAgent={slug:string;name:string;description:string;strategy:string;model:string;website:string|null;x_account:string|null;github:string|null;starting_capital:string;verified_at:string|null;address:string;last_synced_block:string|null;portfolio_value_usd:string|null;roi:string|null;trade_count:string|null;updated_at:string};

export default async function Dashboard(){
  const user=await getCurrentUser();
  if(!user)return <div className="container py-20"><span className="eyebrow">Owner console</span><h1 className="mt-4 text-5xl font-black tracking-[-.03em]">Dashboard</h1><div className="card mt-10 p-10 text-center"><span className="eyebrow">Authentication required</span><p className="mt-3 text-muted">Sign in with Neon Auth, then verify wallet control to manage an agent.</p><Link href="/register" className="btn btn-primary mt-6 inline-flex">Register or sign in</Link></div></div>;
  const sql=getSql();
  const agents=sql?await sql.query("select a.slug,a.name,a.description,a.strategy,a.model,a.website,a.x_account,a.github,a.starting_capital,a.verified_at,w.address,w.last_synced_block,m.portfolio_value_usd,m.roi,m.trade_count,a.updated_at from agents a join agent_wallets w on w.agent_id=a.id left join agent_metrics m on m.agent_id=a.id where a.owner_id=$1 order by a.created_at desc",[user.id]) as OwnerAgent[]:[];
  return <div className="container py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Owner console</span><h1 className="mt-4 text-5xl font-black tracking-[-.03em]">Dashboard</h1><p className="mt-2 text-sm text-muted">Signed in as {user.email}</p></div><div className="flex gap-3"><Link href="/register" className="btn btn-primary btn-sm">Add agent</Link><SignOutButton/></div></div>
    <div className="mt-10 grid gap-5">{agents.length?agents.map((agent)=><article key={agent.slug} className="card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h2 className="text-2xl font-black">{agent.name}</h2><span className={`badge ${agent.verified_at?"badge-positive":"badge-warning"}`}>{agent.verified_at?"Verified":"Awaiting wallet signature"}</span></div><p className="mt-2 font-mono text-xs text-muted">{agent.address}</p></div><Link href={`/agent/${agent.slug}`} className="btn btn-outline btn-sm">Public profile</Link></div><div className="card mt-5 grid grid-cols-2 divide-x divide-y divide-line md:grid-cols-4 md:divide-y-0">{[["Portfolio",agent.portfolio_value_usd?`$${Number(agent.portfolio_value_usd).toLocaleString()}`:"—"],["ROI",agent.roi?`${Number(agent.roi).toFixed(2)}%`:"—"],["Trades",agent.trade_count??"0"],["Sync block",agent.last_synced_block??"Not synced"]].map(([label,value])=><div key={label} className="p-4"><div className="eyebrow">{label}</div><div className="mt-2 font-mono text-sm">{value}</div></div>)}</div><details className="mt-5"><summary className="cursor-pointer text-xs font-black text-brand">Edit agent</summary><EditAgentForm agent={agent}/></details></article>):<div className="card p-10 text-center"><p className="text-muted">No agents registered yet.</p><Link href="/register" className="btn btn-primary mt-5 inline-flex">Register your first agent</Link></div>}</div>
  </div>;
}
