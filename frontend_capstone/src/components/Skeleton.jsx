/**
 * Reusable skeleton / shimmer loading placeholders.
 * Import the variant you need:
 *   import { PageSkeleton, DashboardSkeleton, TableSkeleton, ... } from '../components/Skeleton';
 */

/* ─── Base pulse bar ─── */
function Bar({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

/* ─── Stat card skeleton ─── */
export function StatCardSkeleton({ count = 6 }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${count} gap-4 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md border border-green-200 p-5 space-y-3">
          <Bar className="h-4 w-20" />
          <Bar className="h-8 w-16" />
          <Bar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/* ─── Chart skeleton ─── */
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-green-200 p-5 space-y-4">
      <Bar className="h-5 w-40" />
      <div className="flex items-end gap-3 h-52">
        {[40, 65, 50, 80, 55, 70, 45, 75, 60, 85, 50, 90].map((h, i) => (
          <div key={i} className="flex-1">
            <Bar className={`w-full rounded-t`} style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bar key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

/* ─── Table row skeleton ─── */
export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-green-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={`px-5 py-4 flex gap-4 ${r % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
          {Array.from({ length: cols }).map((_, c) => (
            <Bar key={c} className={`h-4 flex-1 ${c === 0 ? 'max-w-[180px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Card grid skeleton (e.g., equipment cards) ─── */
export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md border border-green-200 overflow-hidden">
          <Bar className="h-40 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <Bar className="h-5 w-3/4" />
            <Bar className="h-3 w-1/2" />
            <div className="flex justify-between pt-2">
              <Bar className="h-4 w-16" />
              <Bar className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Form skeleton ─── */
export function FormSkeleton({ fields = 5 }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-green-200 p-6 space-y-6 max-w-2xl">
      <Bar className="h-6 w-48" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Bar className="h-4 w-28" />
          <Bar className="h-10 w-full" />
        </div>
      ))}
      <Bar className="h-10 w-32 rounded-lg" />
    </div>
  );
}

/* ─── Full Dashboard skeleton (stat cards + filter + charts) ─── */
export function DashboardSkeleton({ statCount = 6 }) {
  return (
    <div className="space-y-6">
      <Bar className="h-7 w-48" />
      <StatCardSkeleton count={statCount} />
      {/* Period filter placeholder */}
      <div className="flex gap-2 mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

/* ─── Page skeleton with header + filter buttons + table ─── */
export function ListPageSkeleton({ statCount = 0, cols = 5, rows = 8 }) {
  return (
    <div className="space-y-6">
      <Bar className="h-7 w-48" />
      {statCount > 0 && <StatCardSkeleton count={statCount} />}
      {/* Filter buttons */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bar key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <TableSkeleton rows={rows} cols={cols} />
    </div>
  );
}

/* ─── Simple centered spinner (kept for inline/button use) ─── */
export function Spinner({ size = 'h-8 w-8', color = 'border-green-600' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full ${size} border-b-2 ${color}`} />
    </div>
  );
}
