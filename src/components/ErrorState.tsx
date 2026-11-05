import { CircleX, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this right now.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-8 text-center dark:border-red-900/60 dark:bg-red-950/20">
      <CircleX className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
      <p className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}
