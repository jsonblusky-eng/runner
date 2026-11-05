import { zodResolver } from '@hookform/resolvers/zod'
import { subDays } from 'date-fns'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { activityIconFor } from '../../components/ActivityIcon'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { EmptyState } from '../../components/EmptyState'
import { ErrorState } from '../../components/ErrorState'
import { Field, Input, Textarea } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { SkeletonCard } from '../../components/Skeleton'
import { useToast } from '../../components/Toast'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { toISODate, todayISO } from '../../lib/dates'
import { humanizeError } from '../../lib/errors'
import {
  formatPace,
  formatSpeed,
  paceSecPerKm,
  restTimeSec,
} from '../../lib/pace'
import { formatDuration, formatDurationShort, parseTimeInput } from '../../lib/time'
import {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  RUN_TYPES,
  RUN_TYPE_LABELS,
  type ActivityType,
} from '../../types/database'
import {
  activityFormSchema,
  activityFormToPayload,
  parseDecimal,
  type ActivityFormValues,
} from '../../types/schemas'
import {
  activityToFormDefaults,
  activityToPayload,
  useActivity,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
} from './queries'

const LAST_TYPE_KEY = 'stride-last-activity-type'

function readInitialType(param: string | null): ActivityType {
  if (param && (ACTIVITY_TYPES as readonly string[]).includes(param)) {
    return param as ActivityType
  }
  const stored = window.localStorage.getItem(LAST_TYPE_KEY)
  if (stored && (ACTIVITY_TYPES as readonly string[]).includes(stored)) {
    return stored as ActivityType
  }
  return 'run'
}

function secondsFromInput(value: string): number | null {
  if (!value.trim()) return null
  const parsed = parseTimeInput(value)
  return parsed.ok ? parsed.seconds : null
}

function TimeHint({ value }: { value: string }) {
  if (!value.trim()) return null
  const parsed = parseTimeInput(value)

  if (!parsed.ok) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400" aria-live="polite">
        {parsed.error}
      </p>
    )
  }

  return (
    <p className="text-xs text-accent-700 dark:text-accent-300" aria-live="polite">
      = {formatDuration(parsed.seconds)}
    </p>
  )
}

export function ActivityFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const online = useOnlineStatus()

  const activityQuery = useActivity(id)
  const createMutation = useCreateActivity()
  const updateMutation = useUpdateActivity(id ?? '')
  const deleteMutation = useDeleteActivity()

  const [initialType] = useState(() => readInitialType(searchParams.get('type')))
  const [detailsOpen, setDetailsOpen] = useState(false)
  const hydratedId = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: initialType,
      activity_date: todayISO(),
      distance_km: '',
      moving_time: '',
      total_time: '',
      elevation_m: '',
      run_type: '',
      exercise_name: '',
      sets: '',
      effort: null,
      notes: '',
    },
  })

  const type = watch('type')
  const distanceValue = watch('distance_km')
  const movingValue = watch('moving_time')
  const totalValue = watch('total_time')
  const effort = watch('effort')

  const activity = activityQuery.data

  useEffect(() => {
    if (!activity) return
    if (hydratedId.current === activity.id) return
    reset(activityToFormDefaults(activity))
    if (
      activity.total_time_sec !== null ||
      activity.effort !== null ||
      Boolean(activity.notes)
    ) {
      setDetailsOpen(true)
    }
    hydratedId.current = activity.id
  }, [activity, reset])

  useEffect(() => {
    if (isEdit) return
    const param = searchParams.get('type')
    if (param && (ACTIVITY_TYPES as readonly string[]).includes(param)) {
      setValue('type', param as ActivityType)
    }
  }, [isEdit, searchParams, setValue])

  useEffect(() => {
    window.localStorage.setItem(LAST_TYPE_KEY, type)
  }, [type])

  const preview = useMemo(() => {
    const distance = parseDecimal(distanceValue)
    const movingSeconds = secondsFromInput(movingValue)
    const totalSeconds = secondsFromInput(totalValue)
    const pace = formatPace(paceSecPerKm(distance, movingSeconds))
    const speed = formatSpeed(distance, movingSeconds)
    const rest =
      totalSeconds !== null &&
      movingSeconds !== null &&
      totalSeconds >= movingSeconds
        ? restTimeSec(totalSeconds, movingSeconds)
        : null
    return { pace, speed, rest }
  }, [distanceValue, movingValue, totalValue])

  const showDistance = type !== 'strength'
  const saving =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: ActivityFormValues) => {
    if (!online) {
      toast({
        title: 'You are offline',
        description:
          'Your form is kept. Try saving again when you have a connection.',
        variant: 'error',
      })
      return
    }

    const payload = activityFormToPayload(values)

    try {
      if (isEdit && id && activity) {
        const previous = activityToPayload(activity)
        await updateMutation.mutateAsync(payload)
        toast({
          title: 'Changes saved',
          variant: 'success',
          action: {
            label: 'Undo',
            onClick: () => {
              void updateMutation.mutateAsync(previous).catch((error: unknown) => {
                toast({
                  title: 'Could not undo',
                  description: humanizeError(error, 'Try again in a moment.'),
                  variant: 'error',
                })
              })
            },
          },
        })
        navigate(`/history/${id}`, { replace: true })
      } else {
        const created = await createMutation.mutateAsync(payload)
        toast({
          title: 'Activity saved',
          description: 'Nice work.',
          variant: 'success',
          action: {
            label: 'Undo',
            onClick: () => {
              void deleteMutation.mutateAsync(created.id).catch((error: unknown) => {
                toast({
                  title: 'Could not undo',
                  description: humanizeError(error, 'Try again in a moment.'),
                  variant: 'error',
                })
              })
            },
          },
        })
        navigate('/', { replace: true })
      }
    } catch (error) {
      toast({
        title: 'Could not save',
        description: humanizeError(error, 'Check your connection and try again.'),
        variant: 'error',
      })
    }
  }

  if (id && activityQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Edit activity" backTo="/history" />
        <div className="space-y-4">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={3} />
        </div>
      </div>
    )
  }

  if (id && activityQuery.isError) {
    return (
      <div>
        <PageHeader title="Edit activity" backTo="/history" />
        <ErrorState
          title="Could not load activity"
          message={humanizeError(activityQuery.error, 'Try again.')}
          onRetry={() => {
            void activityQuery.refetch()
          }}
        />
      </div>
    )
  }

  if (id && activityQuery.isSuccess && !activity) {
    return (
      <div>
        <PageHeader title="Activity not found" backTo="/history" />
        <EmptyState
          icon={Info}
          title="This activity is gone"
          description="It may have been deleted already."
          action={
            <Button variant="secondary" onClick={() => navigate('/history')}>
              Back to history
            </Button>
          }
        />
      </div>
    )
  }

  const isStrength = type === 'strength'

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit activity' : 'Log activity'}
        subtitle={isEdit ? 'Fix the numbers from Strava.' : 'Copy the final numbers. Takes seconds.'}
        backTo={isEdit ? '/history' : undefined}
      />

      <form
        id="activity-form"
        className="space-y-5 pb-24"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Activity
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_TYPES.map((activityType) => {
              const Icon = activityIconFor(activityType)
              return (
                <Chip
                  key={activityType}
                  active={type === activityType}
                  className="min-h-12 w-full px-2"
                  onClick={() => setValue('type', activityType, { shouldDirty: true })}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {ACTIVITY_LABELS[activityType]}
                </Chip>
              )
            })}
          </div>
        </section>

        {isStrength ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Strength
            </p>
            <Field
              label="Exercise name"
              htmlFor="exercise-name"
              optional
              error={errors.exercise_name?.message}
              hint="What you trained, e.g. Squats and bench."
            >
              <Input
                id="exercise-name"
                type="text"
                autoComplete="off"
                maxLength={120}
                placeholder="Squats, bench, curls"
                {...register('exercise_name')}
              />
            </Field>

            <Field
              label="Sets"
              htmlFor="sets"
              optional
              error={errors.sets?.message}
              hint="Total number of sets in the session."
            >
              <Input
                id="sets"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12"
                {...register('sets')}
              />
            </Field>
          </section>
        ) : null}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            When
          </p>
          <Field
            label="Date"
            htmlFor="activity-date"
            error={errors.activity_date?.message}
          >
            <div className="flex gap-2">
              <Input
                id="activity-date"
                type="date"
                className="flex-1"
                {...register('activity_date')}
              />
              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                onClick={() =>
                  setValue('activity_date', toISODate(subDays(new Date(), 1)), {
                    shouldDirty: true,
                  })
                }
              >
                Yesterday
              </Button>
            </div>
          </Field>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Numbers
          </p>

          {showDistance ? (
            <Field
              label="Distance (km)"
              htmlFor="distance"
              error={errors.distance_km?.message}
              hint="Comma or dot both work."
            >
              <Input
                id="distance"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="10.4"
                {...register('distance_km')}
              />
            </Field>
          ) : null}

          <Field
            label={isStrength ? 'Duration' : 'Moving time'}
            htmlFor="moving-time"
            error={errors.moving_time?.message}
            hint="Example: 45, 45:30 or 2:09:58"
          >
            <Input
              id="moving-time"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder={isStrength ? '45:00' : '2:09:58'}
              {...register('moving_time')}
            />
            <TimeHint value={movingValue} />
          </Field>

          {showDistance ? (
            <Field
              label="Elevation gain (m)"
              htmlFor="elevation"
              optional
              error={errors.elevation_m?.message}
            >
              <Input
                id="elevation"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="120"
                {...register('elevation_m')}
              />
            </Field>
          ) : null}
        </section>

        {type === 'run' ? (
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Run type
            </p>
            <div className="flex flex-wrap gap-2">
              {RUN_TYPES.map((runType) => (
                <Chip
                  key={runType}
                  active={watch('run_type') === runType}
                  onClick={() =>
                    setValue(
                      'run_type',
                      watch('run_type') === runType ? '' : runType,
                      { shouldDirty: true },
                    )
                  }
                >
                  {RUN_TYPE_LABELS[runType]}
                </Chip>
              ))}
            </div>
          </section>
        ) : null}

        {preview.pace || preview.speed || preview.rest !== null ? (
          <Card className="border-accent-200 bg-accent-50/70 p-4 dark:border-accent-900 dark:bg-accent-950/20">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {preview.pace ? (
                <p className="text-sm text-accent-900 dark:text-accent-200">
                  <span className="text-2xl font-bold tracking-tight">{preview.pace}</span>
                  <span className="ml-1 font-medium">/km</span>
                </p>
              ) : null}
              {preview.speed ? (
                <p className="text-sm font-medium text-accent-800 dark:text-accent-300">
                  {preview.speed}
                </p>
              ) : null}
              {preview.rest !== null ? (
                <p className="text-sm font-medium text-accent-800 dark:text-accent-300">
                  {preview.rest > 0
                    ? `${formatDurationShort(preview.rest)} stopped`
                    : 'no stopped time'}
                </p>
              ) : null}
            </div>
          </Card>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            aria-expanded={detailsOpen}
            className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={() => setDetailsOpen((open) => !open)}
          >
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                More details
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                Total time, effort and notes
              </span>
            </span>
            {detailsOpen ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            )}
          </button>

          {detailsOpen ? (
            <div className="space-y-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
              <Field
                label="Total time"
                htmlFor="total-time"
                optional
                error={errors.total_time?.message}
                hint="Include pauses. Rest time is calculated."
              >
                <Input
                  id="total-time"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="2:24:58"
                  {...register('total_time')}
                />
                <TimeHint value={totalValue} />
              </Field>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Effort
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {effort === null ? 'Not set' : `${effort} / 10`}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Effort ${value} of 10`}
                      aria-pressed={effort === value}
                      className={
                        effort === value
                          ? 'min-h-11 rounded-xl bg-accent-600 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950'
                          : 'min-h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950'
                      }
                      onClick={() =>
                        setValue('effort', effort === value ? null : value, {
                          shouldDirty: true,
                        })
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Notes"
                htmlFor="notes"
                optional
                error={errors.notes?.message}
              >
                <Textarea
                  id="notes"
                  placeholder="Drank Coke, 15 min rest, felt strong…"
                  {...register('notes')}
                />
              </Field>
            </div>
          ) : null}
        </section>

        {errors.root?.message ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </p>
        ) : null}
      </form>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 border-t border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto w-full max-w-md">
          <Button
            type="submit"
            form="activity-form"
            size="lg"
            fullWidth
            loading={saving}
          >
            {isEdit ? 'Save changes' : 'Save activity'}
          </Button>
        </div>
      </div>
    </div>
  )
}
