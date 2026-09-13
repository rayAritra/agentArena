import { NextResponse } from "next/server";
import { walletSchema } from "@/lib/validation/agent";
import { getPublicWalletProfile } from "@/lib/data/wallet-profile";
import { rateLimit, requestKey } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  if (!rateLimit(`wallet-profile:${requestKey(request)}`, 30, 60_000).allowed)
    return NextResponse.json(
      { error: "Too many wallet lookups" },
      { status: 429 },
    );
  const parsed = walletSchema.safeParse((await params).address);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid Robinhood Chain address" },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      {
        data: await getPublicWalletProfile(parsed.data),
        meta: {
          methodology: "Observed USDG/Stock Token flows; FIFO",
          verification:
            "Wallet activity is public but AI ownership is unverified until signed",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("public wallet profile failed", error);
    return NextResponse.json(
      { error: "The explorer could not build this wallet profile right now" },
      { status: 503 },
    );
  }
}
