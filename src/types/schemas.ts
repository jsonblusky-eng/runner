import { z } from 'zod'
import {
  ACTIVITY_TYPES,
  GOAL_METRICS,
  GOAL_PERIODS,
  RUN_TYPES,
  type ActivityPayload,
  type ActivityType,
  type GoalMetric,
  type GoalPeriod,
  type RunType,
} from './database'
import { parseTimeInput } from '../lib/time'

const decimalInput = /^\d+(?:[.,]\d+)?$/
const integerInput = /^\d+$/
const isoDate = /^\d{4}-\d{2}-\d{2}$/

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const activityFormSchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES),
    activity_date: z
      .string()
      .regex(isoDate, 'Pick a valid date (YYYY-MM-DD).'),
    distance_km: z.string(),
    moving_time: z.string(),
    total_time: z.string(),
    elevation_m: z.string(),
    run_type: z.union([z.enum(RUN_TYPES), z.literal('')]),
    effort: z.union([
      z.number().int().min(1, 'Effort must be 1–10.').max(10, 'Effort must be 1–10.'),
      z.null(),
    ]),
    exercise_name: z.string().max(120, 'Exercise name is limited to 120 characters.'),
    sets: z.string(),
    notes: z.string().max(2000, 'Notes are limited to 2000 characters.'),
  })
  .superRefine((value, ctx) => {
    if (value.distance_km.trim() !== '') {
      if (!decimalInput.test(value.distance_km.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['distance_km'],
          message: 'Use a number like 5.2 (comma is okay too).',
        })
      }
    }

    let movingSeconds: number | null = null
    if (value.moving_time.trim() !== '') {
      const parsed = parseTimeInput(value.moving_time)
      if (!parsed.ok) {
        ctx.addIssue({
          code: 'custom',
          path: ['moving_time'],
          message: parsed.error,
        })
      } else {
        movingSeconds = parsed.seconds
      }
    }

    if (value.total_time.trim() !== '') {
      const parsed = parseTimeInput(value.total_time)
      if (!parsed.ok) {
        ctx.addIssue({
          code: 'custom',
          path: ['total_time'],
          message: parsed.error,
        })
      } else if (movingSeconds !== null && parsed.seconds < movingSeconds) {
        ctx.addIssue({
          code: 'custom',
          path: ['total_time'],
          message: "Total time can't be less than moving time.",
        })
      }
    }

    if (value.elevation_m.trim() !== '') {
      if (!integerInput.test(value.elevation_m.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['elevation_m'],
          message: 'Use a whole number of meters.',
        })
      }
    }

    const setsInput = value.sets.trim()
    if (setsInput !== '') {
      const parsed = Number(setsInput)
      if (!integerInput.test(setsInput) || parsed < 1 || parsed > 999) {
        ctx.addIssue({
          code: 'custom',
          path: ['sets'],
          message: 'Use a whole number of sets (1–999).',
        })
      }
    }
  })

export type ActivityFormValues = z.infer<typeof activityFormSchema>

export const goalFormSchema = z.object({
  period: z.enum(GOAL_PERIODS),
  metric: z.enum(GOAL_METRICS),
  activity_type: z.union([z.enum(ACTIVITY_TYPES), z.literal('all')]),
  target_value: z
    .string()
    .refine(
      (value) => decimalInput.test(value.trim()) && Number(value.replace(',', '.')) > 0,
      'Enter a target above zero.',
    ),
})

export type GoalFormValues = z.infer<typeof goalFormSchema>

export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!decimalInput.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function activityFormToPayload(values: ActivityFormValues): ActivityPayload {
  const moving = values.moving_time.trim() === '' ? null : parseTimeInput(values.moving_time)
  const total = values.total_time.trim() === '' ? null : parseTimeInput(values.total_time)

  const isStrength = values.type === 'strength'

  return {
    activity_date: values.activity_date,
    type: values.type,
    distance_km:
      isStrength || values.distance_km.trim() === ''
        ? null
        : parseDecimal(values.distance_km),
    moving_time_sec: moving?.ok ? moving.seconds : null,
    total_time_sec: total?.ok ? total.seconds : null,
    elevation_m:
      isStrength || values.elevation_m.trim() === ''
        ? null
        : Number(values.elevation_m.trim()),
    run_type:
      values.type === 'run' && values.run_type !== ''
        ? (values.run_type as RunType)
        : null,
    exercise_name:
      values.type === 'strength' && values.exercise_name.trim() !== ''
        ? values.exercise_name.trim()
        : null,
    sets:
      values.type === 'strength' && values.sets.trim() !== ''
        ? Number(values.sets.trim())
        : null,
    effort: values.effort,
    notes: values.notes.trim() === '' ? null : values.notes.trim(),
  }
}

export function goalFormToInsert(values: GoalFormValues): {
  period: GoalPeriod
  metric: GoalMetric
  activity_type: ActivityType | null
  target_value: number
} {
  return {
    period: values.period,
    metric: values.metric,
    activity_type: values.activity_type === 'all' ? null : values.activity_type,
    target_value: Number(values.target_value.replace(',', '.')),
  }
}
