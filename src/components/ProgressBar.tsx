import { cn } from '../lib/format'

interface ProgressBarProps {
  value: number
  reached?: boolean
  className?: string
  label?: string
}

export function ProgressBar({ value, reached = false, className, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
      className={cn(
        'h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500',
          reached ? 'bg-accent-600' : 'bg-accent-500',
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}
