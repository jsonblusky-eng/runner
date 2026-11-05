import { CircleCheck, Pencil, Plus, Target, Trash } from 'lucide-react'
import { useState } from 'react'
import { ActivityIcon } from '../../components/ActivityIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { PageHeader } from '../../components/PageHeader'
import { ProgressBar } from '../../components/ProgressBar'
import { SkeletonCard } from '../../components/Skeleton'
import { useToast } from '../../components/Toast'
import { useNow } from '../../hooks/useNow'
import { cn } from '../../lib/format'
import { humanizeError } from '../../lib/errors'
import {
  formatGoalPair,
  goalProgress,
  type GoalProgress,
} from '../../lib/stats'
import {
  ACTIVITY_LABELS,
  GOAL_PERIODS,
  METRIC_LABELS,
  PERIOD_LABELS,
  type GoalRow,
} from '../../types/database'
import { GoalFormSheet } from './GoalFormSheet'
import { useDeleteGoal, useGoals, useUpdateGoal } from './queries'
import { useOverviewActivities } from '../activities/queries'

const periodBlurbs: Record<(typeof GOAL_PERIODS)[number], string> = {
  daily: 'Today',
  weekly: 'This week',
  monthly: 'This month',
}

interface GoalCardProps {
  progress: GoalProgress
  togglePending: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

function GoalCard({
  progress,
  togglePending,
  onEdit,
  onDelete,
  onToggle,
}: GoalCardProps) {
  const { goal, value, target, ratio, reached } = progress
  const typeLabel = goal.activity_type
    ? ACTIVITY_LABELS[goal.activity_type]
    : 'All types'
  const activeReached = goal.is_active && reached

  return (
    <Card
      className={cn(
        activeReached &&
          'border-accent-300 bg-accent-50/60 dark:border-accent-800 dark:bg-accent-950/20',
        !goal.is_active && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-3">
        {goal.activity_type ? (
          <ActivityIcon type={goal.activity_type} size="sm" />
        ) : (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Target className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {METRIC_LABELS[goal.metric]} · {typeLabel}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatGoalPair(goal.metric, value, target)}
            </span>
          </p>
        </div>
        {activeReached ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-100 px-2 py-1 text-[11px] font-semibold text-accent-800 dark:bg-accent-900/40 dark:text-accent-300">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Reached
          </span>
        ) : null}
      </div>

      <ProgressBar
        value={ratio}
        reached={activeReached}
        className="mt-3"
        label={`${METRIC_LABELS[goal.metric]} progress: ${Math.round(ratio * 100)}%`}
      />

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <button
          type="button"
          role="switch"
          aria-checked={goal.is_active}
          aria-label={goal.is_active ? 'Pause this goal' : 'Activate this goal'}
          disabled={togglePending}
          className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-xs font-medium text-zinc-600 disabled:opacity-50 dark:text-zinc-300"
          onClick={onToggle}
        >
          <span
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              goal.is_active ? 'bg-accent-600' : 'bg-zinc-300 dark:bg-zinc-700',
            )}
          >
            <span
              className={cn(
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform',
                goal.is_active && 'translate-x-5',
              )}
            />
          </span>
          {goal.is_active ? 'Active' : 'Paused'}
        </button>

        <div className="flex items-center">
          <button
            type="button"
            aria-label="Edit goal"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Delete goal"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            onClick={onDelete}
          >
            <Trash className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  )
}

export function GoalsPage() {
  const { toast } = useToast()
  const goalsQuery = useGoals()
  const activitiesQuery = useOverviewActivities()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<GoalRow | null>(null)

  const now = useNow()
  const goals = goalsQuery.data ?? []
  const activities = activitiesQuery.data ?? []
  const activeCount = goals.filter((goal) => goal.is_active).length
  const isLoading = goalsQuery.isLoading || activitiesQuery.isLoading
  const isError = goalsQuery.isError || activitiesQuery.isError

  const openCreate = () => {
    setEditingGoal(null)
    setFormOpen(true)
  }

  const openEdit = (goal: GoalRow) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  const handleToggle = (goal: GoalRow) => {
    updateMutation.mutate(
      { id: goal.id, payload: { is_active: !goal.is_active } },
      {
        onError: (error) => {
          toast({
            title: 'Could not update goal',
            description: humanizeError(error, 'Try again in a moment.'),
            variant: 'error',
          })
        },
      },
    )
  }

  const handleDelete = async () => {
    if (!goalToDelete) return
    try {
      await deleteMutation.mutateAsync(goalToDelete.id)
      toast({ title: 'Goal deleted', variant: 'success' })
      setGoalToDelete(null)
    } catch (error) {
      toast({
        title: 'Could not delete goal',
        description: humanizeError(error, 'Try again in a moment.'),
        variant: 'error',
      })
    }
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle={
          isLoading
            ? 'Loading targets…'
            : `${activeCount} active ${activeCount === 1 ? 'target' : 'targets'}`
        }
        action={
          <Button variant="secondary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load goals"
          message={humanizeError(
            goalsQuery.error ?? activitiesQuery.error,
            'Check your connection and try again.',
          )}
          onRetry={() => {
            void goalsQuery.refetch()
            void activitiesQuery.refetch()
          }}
        />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a weekly run distance, a strength session target, or a daily moving-time goal."
          action={<Button onClick={openCreate}>Create your first goal</Button>}
        />
      ) : (
        <div className="space-y-6">
          {GOAL_PERIODS.map((period) => {
            const groupGoals = goals
              .filter((goal) => goal.period === period)
              .sort(
                (a, b) =>
                  Number(b.is_active) - Number(a.is_active) ||
                  a.created_at.localeCompare(b.created_at),
              )

            if (groupGoals.length === 0) return null

            return (
              <section key={period}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {PERIOD_LABELS[period]}
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {periodBlurbs[period]}
                  </p>
                </div>
                <div className="space-y-2.5">
                  {groupGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      progress={goalProgress(goal, activities, now, 1)}
                      togglePending={updateMutation.isPending}
                      onEdit={() => openEdit(goal)}
                      onDelete={() => setGoalToDelete(goal)}
                      onToggle={() => handleToggle(goal)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <GoalFormSheet
        open={formOpen}
        goal={editingGoal}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={goalToDelete !== null}
        title="Delete this goal?"
        message="The goal and its target will be removed. Your logged activities stay safe."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete()
        }}
        onClose={() => setGoalToDelete(null)}
      />
    </div>
  )
}
