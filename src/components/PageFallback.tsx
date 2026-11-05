import { LoaderCircle } from 'lucide-react'

export function PageFallback() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <LoaderCircle
        className="h-6 w-6 animate-spin text-accent-600 dark:text-accent-400"
        aria-label="Loading"
      />
    </div>
  )
}
