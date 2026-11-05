import { format } from 'date-fns'
import {
  CircleCheck,
  Dumbbell,
  Flame,
  Footprints,
  Settings as SettingsIcon,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ActivityIcon } from '../../components/ActivityIcon'
import { Button } from '../../components/Button'
import { useNow } from '../../hooks/useNow'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { ProgressBar } from '../../components/ProgressBar'
import { SkeletonCard } from '../../components/Skeleton'
import {
  formatLongDate,
  getMonthRange,
  getWeekRange,
  todayISO,
} from '../../lib/dates'
import { cn, formatNumber } from '../../lib/format'
import { humanizeError } from '../../lib/errors'
import {
  calculateStreak,
  filterByRange,
  formatGoalPair,
  getMileageWarning,
  goalProgress,
  summarizeActivities,
  weeklyDistanceSeries,
  type GoalProgress,
  type PeriodSummary,
  type WeeklyDistancePoint,
} from '../../lib/stats'
import { formatDuration, formatDurationShort } from '../../lib/time'
import {
  ACTIVITY_LABELS,
  METRIC_LABELS,
  RUN_TYPE_LABELS,
  type GoalRow,
} from '../../types/database'
import { useGoals } from '../goals/queries'
import { useOverviewActivities } from '../activities/queries'

const DISMISS_KEY = 'stride-mileage-warning-dismissed-week'

function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatBlock({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50',
          emphasis ? 'text-2xl' : 'text-lg',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function SummaryGrid({ summary }: { summary: PeriodSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBlock
        label="Distance"
        value={`${formatNumber(summary.distanceKm, 1)} km`}
        emphasis
      />
      <StatBlock label="Moving" value={formatDurationShort(summary.movingTimeSec)} />
      <StatBlock
        label="Elevation"
        value={`${formatNumber(Math.round(summary.elevationM), 0)} m`}
      />
      <StatBlock
        label="Sessions"
        value={`${summary.sessions} ${summary.sessions === 1 ? 'session' : 'sessions'}`}
      />
    </div>
  )
}

function GoalRowProgress({ progress }: { progress: GoalProgress }) {
  const { goal, value, target, ratio, reached } = progress
  const typeLabel = goal.activity_type
    ? ACTIVITY_LABELS[goal.activity_type]
    : 'All types'

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {METRIC_LABELS[goal.metric]} · {typeLabel}
        </p>
        <p
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            reached
              ? 'text-accent-700 dark:text-accent-300'
              : 'text-zinc-500 dark:text-zinc-400',
          )}
        >
          {reached ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          <span>{formatGoalPair(goal.metric, value, target)}</span>
        </p>
      </div>
      <ProgressBar
        value={ratio}
        reached={reached}
        className="mt-1.5 h-2.5"
        label={`${METRIC_LABELS[goal.metric]} goal progress`}
      />
    </div>
  )
}

function ChartTooltipStyle() {
  return {
    borderRadius: 12,
    border: '1px solid var(--tooltip-border)',
    backgroundColor: 'var(--tooltip-bg)',
    color: 'var(--tooltip-text)',
    fontSize: 12,
    padding: '8px 10px',
    boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const activitiesQuery = useOverviewActivities()
  const goalsQuery = useGoals()
  const now = useNow()

  const [dismissedWeek, setDismissedWeek] = useState<string | null>(() =>
    window.localStorage.getItem(DISMISS_KEY),
  )

  const activities = activitiesQuery.data ?? []
  const goals = goalsQuery.data ?? []
  const today = todayISO(now)
  const weekRange = getWeekRange(now, 1)
  const monthRange = getMonthRange(now)

  const todayActivities = activities.filter(
    (activity) => activity.activity_date === today,
  )
  const weekActivities = filterByRange(activities, weekRange)
  const monthActivities = filterByRange(activities, monthRange)
  const weekSummary = summarizeActivities(weekActivities)
  const monthSummary = summarizeActivities(monthActivities)
  const streak = calculateStreak(activities, now)
  const mileageWarning = getMileageWarning(activities, now, 1)
  const chartData: WeeklyDistancePoint[] = weeklyDistanceSeries(activities, now, 8, 1)

  const activeGoals = goals.filter((goal) => goal.is_active)
  const dailyGoals = activeGoals.filter((goal) => goal.period === 'daily')
  const weeklyGoals = activeGoals.filter((goal) => goal.period === 'weekly')
  const monthlyGoals = activeGoals.filter((goal) => goal.period === 'monthly')

  const showWarning =
    mileageWarning !== null && dismissedWeek !== weekRange.startISO

  const loading = activitiesQuery.isLoading || goalsQuery.isLoading
  const failed = activitiesQuery.isError || goalsQuery.isError
  const isCompletelyEmpty = activities.length === 0 && goals.length === 0

  const dismissWarning = () => {
    window.localStorage.setItem(DISMISS_KEY, weekRange.startISO)
    setDismissedWeek(weekRange.startISO)
  }

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatLongDate(now)}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {greeting(now)}
          </h1>
        </div>
        <Link
          to="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <SettingsIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
            streak > 0
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
          )}
        >
          <Flame className="h-4 w-4" aria-hidden="true" />
          {streak > 0
            ? `${streak} day${streak === 1 ? '' : 's'} streak`
            : 'No streak yet'}
        </span>
        {activeGoals.length > 0 ? (
          <Link
            to="/goals"
            className="inline-flex min-h-8 items-center rounded-full bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-800 hover:bg-accent-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:bg-accent-950/40 dark:text-accent-300 dark:hover:bg-accent-900/40"
          >
            {activeGoals.length} active {activeGoals.length === 1 ? 'goal' : 'goals'}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
        </div>
      ) : failed ? (
        <ErrorState
          title="Could not load your dashboard"
          message={humanizeError(
            activitiesQuery.error ?? goalsQuery.error,
            'Check your connection and try again.',
          )}
          onRetry={() => {
            void activitiesQuery.refetch()
            void goalsQuery.refetch()
          }}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Today
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {todayActivities.length} logged
              </p>
            </div>

            {todayActivities.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Nothing logged yet. Rest is training too.
              </p>
            ) : (
              <div className="mt-3 space-y-1">
                {todayActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    to={`/history/${activity.id}`}
                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:bg-zinc-800/60"
                  >
                    <ActivityIcon type={activity.type} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {ACTIVITY_LABELS[activity.type]}
                        {activity.run_type
                          ? ` · ${RUN_TYPE_LABELS[activity.run_type]}`
                          : ''}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {[
                          activity.distance_km !== null
                            ? `${formatNumber(activity.distance_km, 2)} km`
                            : null,
                          activity.moving_time_sec !== null
                            ? formatDuration(activity.moving_time_sec)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'No numbers'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {dailyGoals.length > 0 ? (
              <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {dailyGoals.map((goal) => (
                  <GoalRowProgress
                    key={goal.id}
                    progress={goalProgress(goal, activities, now, 1)}
                  />
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="border-accent-200/70 bg-accent-50/40 dark:border-accent-900/70 dark:bg-accent-950/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-800 dark:text-accent-300">
              Quick log
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button size="lg" onClick={() => navigate('/log?type=run')}>
                <Footprints className="h-5 w-5" aria-hidden="true" />
                Run
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/log?type=strength')}
              >
                <Dumbbell className="h-5 w-5" aria-hidden="true" />
                Strength
              </Button>
            </div>
          </Card>

          {isCompletelyEmpty ? (
            <EmptyState
              icon={Footprints}
              title="Log your first activity"
              description="Copy the final numbers from Strava and see your week come together."
              action={<Button onClick={() => navigate('/log?type=run')}>Log a run</Button>}
            />
          ) : (
            <>
              <Card>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    This week
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {format(weekRange.startDate, 'd MMM')} –{' '}
                    {format(weekRange.endDate, 'd MMM')}
                  </p>
                </div>
                <div className="mt-3">
                  <SummaryGrid summary={weekSummary} />
                </div>
                {weeklyGoals.length > 0 ? (
                  <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {weeklyGoals.map((goal: GoalRow) => (
                      <GoalRowProgress
                        key={goal.id}
                        progress={goalProgress(goal, activities, now, 1)}
                      />
                    ))}
                  </div>
                ) : null}
              </Card>

              {showWarning && mileageWarning ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <TrendingUp
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Mileage jump
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">
                        You are at{' '}
                        {formatNumber(mileageWarning.thisWeekKm, 1)} km this week
                        versus {formatNumber(mileageWarning.lastWeekKm, 1)} km last
                        week (+{mileageWarning.percentIncrease}%). Consider keeping
                        the next run easy.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss mileage warning"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400 dark:hover:bg-amber-900/40"
                      onClick={dismissWarning}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : null}

              <Card>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    This month
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {format(now, 'MMMM')}
                  </p>
                </div>
                <div className="mt-3">
                  <SummaryGrid summary={monthSummary} />
                </div>
                {monthlyGoals.length > 0 ? (
                  <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {monthlyGoals.map((goal) => (
                      <GoalRowProgress
                        key={goal.id}
                        progress={goalProgress(goal, activities, now, 1)}
                      />
                    ))}
                  </div>
                ) : null}
              </Card>

              <Card>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Last 8 weeks
                  </h2>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Distance (km)
                  </p>
                </div>
                <div
                  className="mt-3 h-44 w-full"
                  role="img"
                  aria-label="Bar chart of weekly distance over the last 8 weeks"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 4, right: 0, left: -22, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--chart-grid)"
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
                        interval={0}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
                        width={32}
                      />
                      <Tooltip
                        contentStyle={ChartTooltipStyle()}
                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                        formatter={(value) => [
                          `${formatNumber(Number(value), 1)} km`,
                          'Distance',
                        ]}
                      />
                      <Bar dataKey="distanceKm" name="Distance" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.startISO}
                            fill={entry.isCurrent ? '#059669' : '#34d399'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
