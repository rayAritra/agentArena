import { NextResponse } from "next/server";
import { getDiscoveredWallets } from "@/lib/data/wallet-profile";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(
      {
        data: await getDiscoveredWallets(),
        meta: {
          source: "Blockscout API",
          kind: "unverified public wallets",
          updatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("wallet discovery failed", error);
    return NextResponse.json(
      { error: "Live wallet discovery is temporarily unavailable" },
      { status: 503 },
    );
  }
}
