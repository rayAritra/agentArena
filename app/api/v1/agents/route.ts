import { ok } from "@/lib/api/response";
import { getAgents } from "@/lib/data/public-api";

export async function GET() {
  const data = await getAgents();
  return ok(data, {
    count: data.length,
    verified: data.filter((agent) => agent.verified).length,
    observed: data.filter((agent) => !agent.verified).length,
    source: "verified registrations + Blockscout-discovered observed wallets",
  });
}
