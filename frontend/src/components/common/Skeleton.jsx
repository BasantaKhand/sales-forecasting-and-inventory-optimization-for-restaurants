// Animated gray placeholder. Compose these to build loading states.
export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

// A card-shaped skeleton for KPI/stat placeholders.
export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

// A block skeleton for charts/tables.
export function BlockSkeleton({ className = "h-72" }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className={`w-full ${className}`} />
    </div>
  );
}
