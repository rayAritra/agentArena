import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getAgents } from "@/lib/data/repository";
import { getSql } from "@/lib/neon/db";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";
import { agentRegistrationSchema } from "@/lib/validation/agent";

export async function GET() {
  return NextResponse.json({ data: await getAgents() }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}

export async function POST(request: Request) {
  if (!rateLimit(`register:${requestKey(request)}`, 3, 3_600_000).allowed) return NextResponse.json({ error: "Registration limit reached" }, { status: 429 });
  try {
    const input = agentRegistrationSchema.parse(await request.json());
    const sql = getSql();
    if (!sql) return NextResponse.json({ error: "Registration persistence requires Neon. Demo mode remains read-only." }, { status: 503 });
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const rows = await sql.query(
      `with ensured_profile as (
         insert into profiles (id, display_name) values ($1, $2)
         on conflict (id) do update set display_name=excluded.display_name, updated_at=now()
       ), new_agent as (
         insert into agents (owner_id,slug,name,description,strategy,model,website,x_account,github,starting_capital)
         values ($1,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         returning id,slug,name,description,strategy,model,website,x_account,github,starting_capital,created_at
       ), new_wallet as (
         insert into agent_wallets (agent_id,address) select id,$12 from new_agent
       ) select * from new_agent`,
      [user.id, user.name ?? user.email ?? null, slug, input.name, input.description, input.strategy, input.model, input.website || null, input.xAccount || null, input.github || null, input.startingCapital, input.wallet],
    );
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    return NextResponse.json({ error: code === "23505" ? "Agent name or wallet already exists" : error instanceof Error ? error.message : "Invalid registration" }, { status: code === "23505" ? 409 : 400 });
  }
}
