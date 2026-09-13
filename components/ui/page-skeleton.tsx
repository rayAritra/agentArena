export function PageSkeleton() {
  return (
    <div className="container animate-pulse py-14" aria-label="Loading" aria-busy="true">
      <div className="h-3 w-28 rounded-full bg-surface-2" />
      <div className="mt-6 h-16 max-w-3xl rounded-2xl bg-surface-2" />
      <div className="mt-4 h-16 max-w-2xl rounded-2xl bg-surface-2" />
      <div className="card mt-16 grid gap-3 p-4 sm:p-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="h-14 rounded-2xl bg-surface-2" key={i} />
        ))}
      </div>
    </div>
  );
}
