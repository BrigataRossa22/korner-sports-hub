export function TableSkeleton({ rows = 6, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse px-4 py-3" aria-busy="true" aria-label="Učitavanje">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-border py-3 first:border-t-0">
          {Array.from({ length: cols }).map((__, j) => (
            <div
              key={j}
              className={`h-4 rounded bg-muted ${j === 0 ? "w-1/3" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
