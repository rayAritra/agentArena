import { NetworkHeroCanvas } from "@/components/home/network-hero-canvas";

export default function Loading() {
  return (
    <div aria-label="Loading arena" aria-busy="true">
      <div className="relative min-h-[70vh] overflow-hidden bg-[#08090b] sm:min-h-screen">
        <NetworkHeroCanvas className="absolute inset-0" coreX={0.72} coreY={0.46} dimEnd={0.55} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#08090b] via-[#08090b]/45 to-transparent lg:via-[#08090b]/25" />
        <div className="container relative flex min-h-[70vh] items-center sm:min-h-screen">
          <div className="max-w-xl py-24">
            <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
            <div className="mt-6 h-11 w-full max-w-md animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-3 h-11 w-4/5 max-w-sm animate-pulse rounded-2xl bg-white/10" />
            <div className="mt-6 h-4 w-full max-w-md animate-pulse rounded-full bg-white/5" />
            <div className="mt-2 h-4 w-3/4 max-w-sm animate-pulse rounded-full bg-white/5" />
            <div className="mt-8 flex gap-4">
              <div className="h-12 w-40 animate-pulse rounded-full bg-white/10" />
              <div className="h-12 w-48 animate-pulse rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="px-5 py-5 first:pl-0">
              <div className="h-7 w-16 animate-pulse rounded-lg bg-surface-2" />
              <div className="mt-2.5 h-2.5 w-20 animate-pulse rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="card-light overflow-hidden rounded-[32px] py-8 text-center md:py-14">
          <div className="container">
            <div className="mx-auto h-2.5 w-32 animate-pulse rounded-full bg-black/10" />
            <div className="mx-auto mt-4 h-9 w-2/3 max-w-md animate-pulse rounded-2xl bg-black/10" />
            <div className="mx-auto mt-4 h-4 w-1/2 max-w-sm animate-pulse rounded-full bg-black/10" />
            <div className="mt-12 grid gap-10 text-left sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i}>
                  <div className="size-6 animate-pulse rounded-md bg-black/10" />
                  <div className="mt-4 h-3.5 w-24 animate-pulse rounded-full bg-black/10" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-black/10" />
                  <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded-full bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-surface-2" />
          ))}
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="card-light h-80 animate-pulse overflow-hidden rounded-[32px]" />
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="h-64 animate-pulse rounded-[32px] bg-brand/20" />
      </div>
    </div>
  );
}
