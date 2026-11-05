import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { BottomSheet } from '../../components/BottomSheet'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Field, Input } from '../../components/Field'
import { useToast } from '../../components/Toast'
import { humanizeError } from '../../lib/errors'
import {
  ACTIVITY_LABELS,
  ACTIVITY_TYPES,
  GOAL_METRICS,
  GOAL_PERIODS,
  METRIC_LABELS,
  PERIOD_LABELS,
  type ActivityType,
  type GoalMetric,
  type GoalPeriod,
  type GoalRow,
} from '../../types/database'
import {
  goalFormSchema,
  goalFormToInsert,
  type GoalFormValues,
} from '../../types/schemas'
import { useCreateGoal, useUpdateGoal } from './queries'

const unitLabels: Record<GoalMetric, string> = {
  distance_km: 'km',
  duration_min: 'minutes',
  sessions: 'sessions',
  elevation_m: 'meters',
}

function exampleFor(
  period: GoalPeriod,
  metric: GoalMetric,
  activityType: ActivityType | 'all',
): string {
  const exampleValue: Record<GoalMetric, string> = {
    distance_km: '25 km',
    duration_min: '150 minutes',
    sessions: '2 sessions',
    elevation_m: '500 m',
  }
  const activity =
    activityType === 'all' ? 'any activity' : ACTIVITY_LABELS[activityType].toLowerCase()
  const periodText =
    period === 'daily' ? 'per day' : period === 'weekly' ? 'per week' : 'per month'
  const metricText =
    metric === 'distance_km'
      ? 'distance'
      : metric === 'duration_min'
        ? 'moving time'
        : metric === 'sessions'
          ? 'sessions'
          : 'elevation'

  return `e.g. ${exampleValue[metric]} of ${activity} ${metricText} ${periodText}.`
}

interface GoalFormSheetProps {
  open: boolean
  goal: GoalRow | null
  onClose: () => void
}

export function GoalFormSheet({ open, goal, onClose }: GoalFormSheetProps) {
  const { toast } = useToast()
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      period: 'weekly',
      metric: 'distance_km',
      activity_type: 'all',
      target_value: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (goal) {
      reset({
        period: goal.period,
        metric: goal.metric,
        activity_type: goal.activity_type ?? 'all',
        target_value: String(goal.target_value),
      })
    } else {
      reset({
        period: 'weekly',
        metric: 'distance_km',
        activity_type: 'all',
        target_value: '',
      })
    }
  }, [open, goal, reset])

  const period = watch('period')
  const metric = watch('metric')
  const activityType = watch('activity_type')

  const saving = isSubmitting || createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: GoalFormValues) => {
    try {
      if (goal) {
        await updateMutation.mutateAsync({
          id: goal.id,
          payload: goalFormToInsert(values),
        })
        toast({ title: 'Goal updated', variant: 'success' })
      } else {
        await createMutation.mutateAsync({
          ...goalFormToInsert(values),
          is_active: true,
        })
        toast({ title: 'Goal created', variant: 'success' })
      }
      onClose()
    } catch (error) {
      toast({
        title: 'Could not save goal',
        description: humanizeError(error, 'Check your connection and try again.'),
        variant: 'error',
      })
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'New goal'}
      footer={
        <Button type="submit" form="goal-form" size="lg" fullWidth loading={saving}>
          {goal ? 'Save changes' : 'Create goal'}
        </Button>
      }
    >
      <form id="goal-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Period</p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_PERIODS.map((value) => (
              <Chip
                key={value}
                active={period === value}
                className="w-full"
                onClick={() => setValue('period', value, { shouldDirty: true })}
              >
                {PERIOD_LABELS[value]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Metric</p>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_METRICS.map((value) => (
              <Chip
                key={value}
                active={metric === value}
                className="w-full"
                onClick={() => setValue('metric', value, { shouldDirty: true })}
              >
                {METRIC_LABELS[value]}
                {value === 'duration_min' ? ' (min)' : ''}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Activity type
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              active={activityType === 'all'}
              onClick={() => setValue('activity_type', 'all', { shouldDirty: true })}
            >
              All types
            </Chip>
            {ACTIVITY_TYPES.map((value) => (
              <Chip
                key={value}
                active={activityType === value}
                onClick={() => setValue('activity_type', value, { shouldDirty: true })}
              >
                {ACTIVITY_LABELS[value]}
              </Chip>
            ))}
          </div>
        </div>

        <Field
          label={`Target (${unitLabels[metric]})`}
          htmlFor="goal-target"
          error={errors.target_value?.message}
          hint={exampleFor(period, metric, activityType)}
        >
          <Input
            id="goal-target"
            type="text"
            inputMode={metric === 'sessions' ? 'numeric' : 'decimal'}
            autoComplete="off"
            placeholder={
              metric === 'distance_km'
                ? '25'
                : metric === 'duration_min'
                  ? '150'
                  : metric === 'sessions'
                    ? '2'
                    : '500'
            }
            {...register('target_value')}
          />
        </Field>

        {errors.root?.message ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </BottomSheet>
  )
}
