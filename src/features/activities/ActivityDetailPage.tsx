import { Pencil, Trash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActivityIcon } from '../../components/ActivityIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton, SkeletonCard } from '../../components/Skeleton'
import { useToast } from '../../components/Toast'
import { formatFriendlyDate } from '../../lib/dates'
import { humanizeError } from '../../lib/errors'
import { formatNumber } from '../../lib/format'
import {
  formatPace,
  formatSpeed,
  paceSecPerKm,
  restTimeSec,
} from '../../lib/pace'
import { formatDuration } from '../../lib/time'
import {
  ACTIVITY_LABELS,
  RUN_TYPE_LABELS,
  type ActivityRow,
} from '../../types/database'
import { useActivity, useDeleteActivity } from './queries'

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  )
}

function ActivityDetail({ activity }: { activity: ActivityRow }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const deleteMutation = useDeleteActivity()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const pace = formatPace(
    paceSecPerKm(activity.distance_km, activity.moving_time_sec),
  )
  const speed = formatSpeed(activity.distance_km, activity.moving_time_sec)
  const rest = restTimeSec(activity.total_time_sec, activity.moving_time_sec)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(activity.id)
      setConfirmOpen(false)
      toast({ title: 'Activity deleted', variant: 'success' })
      navigate('/history', { replace: true })
    } catch (error) {
      toast({
        title: 'Could not delete',
        description: humanizeError(error, 'Try again in a moment.'),
        variant: 'error',
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle={formatFriendlyDate(activity.activity_date)}
        backTo="/history"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/log/${activity.id}`)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
        }
      />

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <ActivityIcon type={activity.type} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {ACTIVITY_LABELS[activity.type]}
              </h2>
              {activity.run_type ? (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {RUN_TYPE_LABELS[activity.run_type]}
                </span>
              ) : null}
              {activity.exercise_name ? (
                <span className="max-w-full truncate rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {activity.exercise_name}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {formatFriendlyDate(activity.activity_date)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          {activity.distance_km !== null ? (
            <p className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatNumber(activity.distance_km, 2)}
              </span>
              <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">
                km
              </span>
            </p>
          ) : (
            <p className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
              No distance logged
            </p>
          )}
          {activity.moving_time_sec !== null ? (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {formatDuration(activity.moving_time_sec)} moving
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <DetailStat label="Pace" value={pace ? `${pace} /km` : '—'} />
          <DetailStat
            label="Moving time"
            value={
              activity.moving_time_sec === null
                ? '—'
                : formatDuration(activity.moving_time_sec)
            }
          />
          <DetailStat
            label="Total time"
            value={
              activity.total_time_sec === null
                ? '—'
                : formatDuration(activity.total_time_sec)
            }
          />
          <DetailStat
            label="Rest / stopped"
            value={rest === null || rest === 0 ? (rest === 0 ? 'None' : '—') : formatDuration(rest)}
          />
          <DetailStat
            label="Elevation"
            value={
              activity.elevation_m === null
                ? '—'
                : `${formatNumber(activity.elevation_m, 0)} m`
            }
          />
          <DetailStat label="Avg speed" value={speed ?? '—'} />
          <DetailStat
            label="Effort"
            value={activity.effort === null ? '—' : `${activity.effort} / 10`}
          />
          {activity.sets !== null ? (
            <DetailStat label="Sets" value={String(activity.sets)} />
          ) : null}
        </div>

        {activity.notes ? (
          <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Notes
            </h3>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-300">
              {activity.notes}
            </p>
          </div>
        ) : null}
      </Card>

      <Button
        variant="danger"
        fullWidth
        className="mt-4"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash className="h-4 w-4" aria-hidden="true" />
        Delete activity
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this activity?"
        message="This removes the entry and its numbers permanently. This cannot be undone."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete()
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useActivity(id)

  if (query.isLoading) {
    return (
      <div>
        <PageHeader title="Activity" backTo="/history" />
        <div className="space-y-4">
          <SkeletonCard rows={3} />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div>
        <PageHeader title="Activity" backTo="/history" />
        <ErrorState
          title="Could not load activity"
          message={humanizeError(query.error, 'Try again.')}
          onRetry={() => {
            void query.refetch()
          }}
        />
      </div>
    )
  }

  if (!query.data) {
    return (
      <div>
        <PageHeader title="Activity" backTo="/history" />
        <EmptyState
          icon={Trash}
          title="Activity not found"
          description="It may have been deleted already."
        />
      </div>
    )
  }

  return <ActivityDetail activity={query.data} />
}
