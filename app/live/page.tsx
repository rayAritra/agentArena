import { Radio } from "lucide-react";
import { LiveFeed } from "@/components/arena/live-feed";
import { getArenaEvents } from "@/lib/data/events";

export const metadata = { title: "Live activity" };
export const dynamic = "force-dynamic";

export default async function LivePage() {
  const events = await getArenaEvents({ limit: 100 });
  return (
    <div className="container py-12">
      <div className="badge badge-positive badge-dot badge-live">
        <Radio size={13} /> Live tape · persisted onchain events
      </div>
      <h1 className="mt-4 text-5xl font-black tracking-[-.03em] md:text-6xl">Market tape</h1>
      <p className="mt-4 max-w-2xl text-muted">Every event streams in as it&rsquo;s indexed and persisted. Unavailable data is never filled in.</p>
      <LiveFeed initial={events} />
    </div>
  );
}
