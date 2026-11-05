import { subDays, subWeeks } from 'date-fns'
import type {
  ActivityRow,
  ActivityType,
  GoalMetric,
  GoalPeriod,
  GoalRow,
} from '../types/database'
import {
  getDayRange,
  getLastWeekBuckets,
  getMonthRange,
  getWeekRange,
  toISODate,
  type DateRange,
  type WeekStartsOn,
} from './dates'
import { formatNumber } from './format'
import { formatMinutes } from './time'

export interface PeriodSummary {
  distanceKm: number
  movingTimeSec: number
  elevationM: number
  sessions: number
}

export interface GoalProgress {
  goal: GoalRow
  value: number
  target: number
  ratio: number
  reached: boolean
  range: DateRange
}

export interface MileageWarning {
  thisWeekKm: number
  lastWeekKm: number
  differenceKm: number
  percentIncrease: number
}

export interface WeeklyDistancePoint {
  label: string
  startISO: string
  distanceKm: number
  isCurrent: boolean
}

export function filterByRange(
  activities: ActivityRow[],
  range: DateRange,
): ActivityRow[] {
  return activities.filter(
    (activity) =>
      activity.activity_date >= range.startISO &&
      activity.activity_date <= range.endISO,
  )
}

export function metricValue(
  activity: ActivityRow,
  metric: GoalMetric,
): number {
  switch (metric) {
    case 'distance_km':
      return activity.distance_km ?? 0
    case 'duration_min':
      return (activity.moving_time_sec ?? 0) / 60
    case 'sessions':
      return 1
    case 'elevation_m':
      return activity.elevation_m ?? 0
  }
}

export function sumMetric(
  activities: ActivityRow[],
  metric: GoalMetric,
): number {
  return activities.reduce(
    (total, activity) => total + metricValue(activity, metric),
    0,
  )
}

export function summarizeActivities(
  activities: ActivityRow[],
): PeriodSummary {
  return {
    distanceKm: sumMetric(activities, 'distance_km'),
    movingTimeSec: activities.reduce(
      (total, activity) => total + (activity.moving_time_sec ?? 0),
      0,
    ),
    elevationM: sumMetric(activities, 'elevation_m'),
    sessions: activities.length,
  }
}

export function currentPeriodRange(
  period: GoalPeriod,
  now: Date,
  weekStartsOn: WeekStartsOn = 1,
): DateRange {
  switch (period) {
    case 'daily':
      return getDayRange(now)
    case 'weekly':
      return getWeekRange(now, weekStartsOn)
    case 'monthly':
      return getMonthRange(now)
  }
}

export function goalProgress(
  goal: GoalRow,
  activities: ActivityRow[],
  now: Date,
  weekStartsOn: WeekStartsOn = 1,
): GoalProgress {
  const range = currentPeriodRange(goal.period, now, weekStartsOn)
  const matching = filterByRange(activities, range).filter(
    (activity) =>
      goal.activity_type === null || activity.type === goal.activity_type,
  )
  const value = sumMetric(matching, goal.metric)
  const target = Number(goal.target_value)
  const ratio = target > 0 ? Math.min(value / target, 1) : 0

  return {
    goal,
    value,
    target,
    ratio,
    reached: target > 0 && value >= target,
    range,
  }
}

export function calculateStreak(
  activities: ActivityRow[],
  now: Date = new Date(),
): number {
  const dates = new Set(activities.map((activity) => activity.activity_date))
  const today = toISODate(now)
  const yesterday = toISODate(subDays(now, 1))

  if (!dates.has(today) && !dates.has(yesterday)) return 0

  let cursor = dates.has(today) ? now : subDays(now, 1)
  let streak = 0

  while (dates.has(toISODate(cursor))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}

export function getMileageWarning(
  activities: ActivityRow[],
  now: Date = new Date(),
  weekStartsOn: WeekStartsOn = 1,
): MileageWarning | null {
  const thisWeek = getWeekRange(now, weekStartsOn)
  const lastWeek = getWeekRange(subWeeks(now, 1), weekStartsOn)

  const runDistance = (range: DateRange): number =>
    filterByRange(activities, range)
      .filter((activity) => activity.type === 'run')
      .reduce((total, activity) => total + (activity.distance_km ?? 0), 0)

  const thisWeekKm = runDistance(thisWeek)
  const lastWeekKm = runDistance(lastWeek)

  if (lastWeekKm <= 0) return null

  const differenceKm = thisWeekKm - lastWeekKm
  const threshold = lastWeekKm * 1.1

  if (differenceKm <= 3 || thisWeekKm <= threshold) return null

  return {
    thisWeekKm,
    lastWeekKm,
    differenceKm,
    percentIncrease: Math.round((differenceKm / lastWeekKm) * 100),
  }
}

export function weeklyDistanceSeries(
  activities: ActivityRow[],
  now: Date = new Date(),
  weeks = 8,
  weekStartsOn: WeekStartsOn = 1,
  type?: ActivityType,
): WeeklyDistancePoint[] {
  return getLastWeekBuckets(now, weeks, weekStartsOn).map((bucket) => {
    const distanceKm = activities
      .filter(
        (activity) =>
          activity.activity_date >= bucket.startISO &&
          activity.activity_date <= bucket.endISO &&
          (type === undefined || activity.type === type),
      )
      .reduce((total, activity) => total + (activity.distance_km ?? 0), 0)

    return {
      label: bucket.label,
      startISO: bucket.startISO,
      distanceKm: Math.round(distanceKm * 10) / 10,
      isCurrent: bucket.isCurrent,
    }
  })
}

export function formatMetricValue(
  metric: GoalMetric,
  value: number,
): string {
  switch (metric) {
    case 'distance_km':
      return `${formatNumber(value, 1)} km`
    case 'duration_min':
      return formatMinutes(value)
    case 'sessions':
      return `${Math.round(value)}`
    case 'elevation_m':
      return `${formatNumber(Math.round(value), 0)} m`
  }
}

export function formatMetricTarget(
  metric: GoalMetric,
  value: number,
): string {
  if (metric === 'sessions') {
    return `${Math.round(value)} ${Math.round(value) === 1 ? 'session' : 'sessions'}`
  }
  return formatMetricValue(metric, value)
}

export function formatGoalPair(
  metric: GoalMetric,
  value: number,
  target: number,
): string {
  switch (metric) {
    case 'distance_km':
      return `${formatNumber(value, 1)} / ${formatNumber(target, 1)} km`
    case 'duration_min':
      return `${formatNumber(Math.round(value), 0)} / ${formatMinutes(target)}`
    case 'sessions':
      return `${Math.round(value)} / ${formatMetricTarget('sessions', target)}`
    case 'elevation_m':
      return `${formatNumber(Math.round(value), 0)} / ${formatNumber(Math.round(target), 0)} m`
  }
}
