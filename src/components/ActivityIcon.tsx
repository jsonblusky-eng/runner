import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  PersonStanding,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/format'
import type { ActivityType } from '../types/database'

const icons: Record<ActivityType, LucideIcon> = {
  run: Footprints,
  strength: Dumbbell,
  trek: Mountain,
  walk: PersonStanding,
  cycling: Bike,
  other: Activity,
}

const styles: Record<ActivityType, string> = {
  run: 'bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300',
  strength: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  trek: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  walk: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  cycling: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  other: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
}

interface ActivityIconProps {
  type: ActivityType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function activityIconFor(type: ActivityType): LucideIcon {
  return icons[type]
}

export function ActivityIcon({ type, size = 'md', className }: ActivityIconProps) {
  const Icon = icons[type]
  const box =
    size === 'lg' ? 'h-12 w-12 rounded-2xl' : size === 'sm' ? 'h-9 w-9 rounded-xl' : 'h-10 w-10 rounded-xl'
  const glyph = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', box, styles[type], className)}
    >
      <Icon className={glyph} aria-hidden="true" />
    </span>
  )
}
