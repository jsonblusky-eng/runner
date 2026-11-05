import { cn } from '../lib/format'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-800',
        className,
      )}
    />
  )
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="h-4 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className={index === 0 ? 'h-8 w-2/3' : 'h-4 w-full'} />
        ))}
      </div>
    </div>
  )
}
