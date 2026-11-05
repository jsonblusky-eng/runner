import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ActivityIcon } from '../../components/ActivityIcon'
import { Card } from '../../components/Card'
import { formatFriendlyDate } from '../../lib/dates'
import { formatNumber } from '../../lib/format'
import { formatPace, paceSecPerKm } from '../../lib/pace'
import { formatDuration } from '../../lib/time'
import {
  ACTIVITY_LABELS,
  RUN_TYPE_LABELS,
  type ActivityRow,
} from '../../types/database'

export function HistoryCard({ activity }: { activity: ActivityRow }) {
  const pace = formatPace(
    paceSecPerKm(activity.distance_km, activity.moving_time_sec),
  )
  const hasNumbers =
    activity.distance_km !== null ||
    activity.moving_time_sec !== null ||
    activity.elevation_m !== null

  return (
    <Card className="overflow-hidden p-0">
      <Link
        to={`/history/${activity.id}`}
        className="flex min-h-[76px] items-start gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
      >
        <ActivityIcon type={activity.type} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {ACTIVITY_LABELS[activity.type]}
              </p>
              {activity.run_type ? (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {RUN_TYPE_LABELS[activity.run_type]}
                </span>
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {formatFriendlyDate(activity.activity_date)}
            </p>
          </div>

          {hasNumbers ? (
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              {activity.distance_km !== null ? (
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {formatNumber(activity.distance_km, 2)} km
                </span>
              ) : null}
              {activity.moving_time_sec !== null ? (
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {formatDuration(activity.moving_time_sec)}
                </span>
              ) : null}
              {activity.type === 'strength' && activity.sets !== null ? (
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {activity.sets} {activity.sets === 1 ? 'set' : 'sets'}
                </span>
              ) : null}
              {pace ? (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pace} /km
                </span>
              ) : null}
              {activity.elevation_m !== null ? (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  ↑ {Math.round(activity.elevation_m)} m
                </span>
              ) : null}
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              No numbers logged
            </p>
          )}

          {activity.type === 'strength' && activity.exercise_name ? (
            <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
              {activity.exercise_name}
            </p>
          ) : null}
          {activity.notes ? (
            <p className="mt-1 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
              {activity.notes}
            </p>
          ) : null}
        </div>
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-400"
          aria-hidden="true"
        />
      </Link>
    </Card>
  )
}
