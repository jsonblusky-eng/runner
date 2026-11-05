import { describe, expect, it } from 'vitest'
import { getMonthRange, getWeekRange, getLastWeekBuckets } from './dates'

describe('week boundaries', () => {
  it('starts weeks on Monday by default', () => {
    const range = getWeekRange(new Date(2026, 10, 5), 1)
    expect(range.startISO).toBe('2026-11-02')
    expect(range.endISO).toBe('2026-11-08')
  })

  it('supports Sunday week starts', () => {
    const range = getWeekRange(new Date(2026, 10, 5), 0)
    expect(range.startISO).toBe('2026-11-01')
    expect(range.endISO).toBe('2026-11-07')
  })

  it('returns month boundaries', () => {
    const range = getMonthRange(new Date(2026, 10, 5))
    expect(range.startISO).toBe('2026-11-01')
    expect(range.endISO).toBe('2026-11-30')
  })

  it('builds last-N-week buckets ending with the current week', () => {
    const buckets = getLastWeekBuckets(new Date(2026, 10, 5), 3, 1)
    expect(buckets).toHaveLength(3)
    expect(buckets[0].startISO).toBe('2026-10-19')
    expect(buckets[1].startISO).toBe('2026-10-26')
    expect(buckets[2].startISO).toBe('2026-11-02')
    expect(buckets[2].isCurrent).toBe(true)
    expect(buckets[0].isCurrent).toBe(false)
  })
})
