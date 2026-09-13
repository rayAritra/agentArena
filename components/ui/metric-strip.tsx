export function MetricStrip({
  items,
  className = "grid-cols-2 sm:grid-cols-4",
}: {
  items: { label: string; value: string; tone?: "positive" | "negative" | "warning" | "" }[];
  className?: string;
}) {
  return (
    <div className={`grid divide-x divide-y divide-line sm:divide-y-0 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="px-4 py-5">
          <span className="eyebrow block text-[9px]">{item.label}</span>
          <strong className={`mono mt-2 block text-lg font-black ${item.tone ?? ""}`}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
