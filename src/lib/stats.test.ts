import { describe, expect, it } from 'vitest'
import type { ActivityRow, GoalRow } from '../types/database'
import {
  calculateStreak,
  getMileageWarning,
  goalProgress,
  weeklyDistanceSeries,
} from './stats'

let nextId = 1

function activity(
  overrides: Partial<ActivityRow> & Pick<ActivityRow, 'activity_date' | 'type'>,
): ActivityRow {
  return {
    id: `activity-${nextId++}`,
    user_id: 'user-1',
    distance_km: null,
    moving_time_sec: null,
    total_time_sec: null,
    elevation_m: null,
    run_type: null,
    effort: null,
    exercise_name: null,
    sets: null,
    notes: null,
    created_at: '2026-11-05T10:00:00Z',
    updated_at: '2026-11-05T10:00:00Z',
    ...overrides,
  }
}

function goal(
  overrides: Partial<GoalRow> & Pick<GoalRow, 'period' | 'metric' | 'target_value'>,
): GoalRow {
  return {
    id: `goal-${nextId++}`,
    user_id: 'user-1',
    activity_type: null,
    is_active: true,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    ...overrides,
  }
}

const now = new Date(2026, 10, 5, 12, 0, 0)

describe('goal progress', () => {
  it('sums matching activities in the current week', () => {
    const activities = [
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 10 }),
      activity({ activity_date: '2026-11-05', type: 'run', distance_km: 5 }),
      activity({ activity_date: '2026-11-03', type: 'walk', distance_km: 7 }),
      activity({ activity_date: '2026-10-28', type: 'run', distance_km: 30 }),
    ]
    const weeklyRun = goal({
      period: 'weekly',
      metric: 'distance_km',
      activity_type: 'run',
      target_value: 25,
    })

    const progress = goalProgress(weeklyRun, activities, now, 1)
    expect(progress.value).toBe(15)
    expect(progress.target).toBe(25)
    expect(progress.ratio).toBeCloseTo(0.6)
    expect(progress.reached).toBe(false)
    expect(progress.range.startISO).toBe('2026-11-02')
    expect(progress.range.endISO).toBe('2026-11-08')
  })

  it('counts sessions and caps the bar at 100% while keeping the real value', () => {
    const activities = [
      activity({
        activity_date: '2026-11-02',
        type: 'strength',
        moving_time_sec: 3000,
      }),
      activity({
        activity_date: '2026-11-04',
        type: 'strength',
        moving_time_sec: 2500,
      }),
      activity({
        activity_date: '2026-11-05',
        type: 'strength',
        moving_time_sec: 2500,
      }),
      activity({
        activity_date: '2026-10-28',
        type: 'strength',
        moving_time_sec: 2500,
      }),
      activity({ activity_date: '2026-11-03', type: 'run', distance_km: 5 }),
    ]
    const weeklyStrength = goal({
      period: 'weekly',
      metric: 'sessions',
      activity_type: 'strength',
      target_value: 2,
    })

    const progress = goalProgress(weeklyStrength, activities, now, 1)
    expect(progress.value).toBe(3)
    expect(progress.ratio).toBe(1)
    expect(progress.reached).toBe(true)
  })

  it('sums moving minutes across all activity types for a daily goal', () => {
    const activities = [
      activity({
        activity_date: '2026-11-05',
        type: 'run',
        moving_time_sec: 1800,
      }),
      activity({
        activity_date: '2026-11-05',
        type: 'strength',
        moving_time_sec: 900,
      }),
      activity({
        activity_date: '2026-11-04',
        type: 'run',
        moving_time_sec: 2700,
      }),
    ]
    const dailyMinutes = goal({
      period: 'daily',
      metric: 'duration_min',
      target_value: 30,
    })

    const progress = goalProgress(dailyMinutes, activities, now, 1)
    expect(progress.value).toBe(45)
    expect(progress.reached).toBe(true)
    expect(progress.ratio).toBe(1)
  })

  it('uses the current calendar month for monthly goals', () => {
    const activities = [
      activity({ activity_date: '2026-11-01', type: 'run', distance_km: 5 }),
      activity({ activity_date: '2026-11-30', type: 'run', distance_km: 5 }),
      activity({ activity_date: '2026-10-31', type: 'run', distance_km: 100 }),
    ]
    const monthly = goal({
      period: 'monthly',
      metric: 'distance_km',
      target_value: 40,
    })

    const progress = goalProgress(monthly, activities, now, 1)
    expect(progress.value).toBe(10)
    expect(progress.ratio).toBe(0.25)
  })

  it('respects Sunday week starts for weekly goals', () => {
    const activities = [
      activity({ activity_date: '2026-11-01', type: 'run', distance_km: 8 }),
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 4 }),
    ]
    const weekly = goal({
      period: 'weekly',
      metric: 'distance_km',
      activity_type: 'run',
      target_value: 20,
    })

    expect(goalProgress(weekly, activities, now, 0).value).toBe(12)
    expect(goalProgress(weekly, activities, now, 1).value).toBe(4)
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const activities = [
      activity({ activity_date: '2026-11-05', type: 'run' }),
      activity({ activity_date: '2026-11-04', type: 'walk' }),
      activity({ activity_date: '2026-11-03', type: 'strength' }),
      activity({ activity_date: '2026-11-01', type: 'run' }),
    ]
    expect(calculateStreak(activities, now)).toBe(3)
  })

  it('allows the streak to end yesterday when today is empty', () => {
    const activities = [
      activity({ activity_date: '2026-11-04', type: 'run' }),
      activity({ activity_date: '2026-11-03', type: 'run' }),
      activity({ activity_date: '2026-11-02', type: 'run' }),
    ]
    expect(calculateStreak(activities, now)).toBe(3)
  })

  it('stops at a gap', () => {
    const activities = [
      activity({ activity_date: '2026-11-05', type: 'run' }),
      activity({ activity_date: '2026-11-03', type: 'run' }),
      activity({ activity_date: '2026-11-02', type: 'run' }),
    ]
    expect(calculateStreak(activities, now)).toBe(1)
  })

  it('returns zero when neither today nor yesterday has activity', () => {
    const activities = [
      activity({ activity_date: '2026-11-03', type: 'run' }),
      activity({ activity_date: '2026-11-02', type: 'run' }),
    ]
    expect(calculateStreak(activities, now)).toBe(0)
    expect(calculateStreak([], now)).toBe(0)
  })

  it('counts a day only once when there are multiple activities', () => {
    const activities = [
      activity({ activity_date: '2026-11-05', type: 'run' }),
      activity({ activity_date: '2026-11-05', type: 'walk' }),
      activity({ activity_date: '2026-11-04', type: 'run' }),
    ]
    expect(calculateStreak(activities, now)).toBe(2)
  })
})

describe('mileage jump warning', () => {
  it('warns when this week exceeds last week by both 10% and 3 km', () => {
    const activities = [
      activity({ activity_date: '2026-10-28', type: 'run', distance_km: 20 }),
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 24 }),
    ]
    const warning = getMileageWarning(activities, now, 1)
    expect(warning).not.toBeNull()
    expect(warning?.thisWeekKm).toBe(24)
    expect(warning?.lastWeekKm).toBe(20)
    expect(warning?.differenceKm).toBe(4)
    expect(warning?.percentIncrease).toBe(20)
  })

  it('does not warn when the extra distance is 3 km or less', () => {
    const activities = [
      activity({ activity_date: '2026-10-28', type: 'run', distance_km: 50 }),
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 53 }),
    ]
    expect(getMileageWarning(activities, now, 1)).toBeNull()
  })

  it('does not warn when the increase is within 10%', () => {
    const activities = [
      activity({ activity_date: '2026-10-28', type: 'run', distance_km: 100 }),
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 110 }),
    ]
    expect(getMileageWarning(activities, now, 1)).toBeNull()
  })

  it('ignores non-running activities', () => {
    const activities = [
      activity({ activity_date: '2026-10-28', type: 'walk', distance_km: 20 }),
      activity({ activity_date: '2026-11-02', type: 'walk', distance_km: 40 }),
    ]
    expect(getMileageWarning(activities, now, 1)).toBeNull()
  })

  it('does not warn without a real last-week baseline', () => {
    const activities = [
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 10 }),
    ]
    expect(getMileageWarning(activities, now, 1)).toBeNull()
  })
})

describe('weekly distance series', () => {
  it('returns one bucket per week with totals for matching activities', () => {
    const activities = [
      activity({ activity_date: '2026-10-20', type: 'run', distance_km: 6 }),
      activity({ activity_date: '2026-11-02', type: 'run', distance_km: 4 }),
      activity({ activity_date: '2026-11-03', type: 'walk', distance_km: 3 }),
    ]
    const series = weeklyDistanceSeries(activities, now, 3, 1)

    expect(series).toHaveLength(3)
    expect(series[0].startISO).toBe('2026-10-19')
    expect(series[0].distanceKm).toBe(6)
    expect(series[2].distanceKm).toBe(7)
    expect(series[2].isCurrent).toBe(true)
  })
})
