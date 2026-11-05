import { Footprints } from 'lucide-react'
import { cn } from '../lib/format'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-sm',
        className,
      )}
    >
      <Footprints className="h-6 w-6" aria-hidden="true" />
    </span>
  )
}
