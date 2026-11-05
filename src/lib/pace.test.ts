import { describe, expect, it } from 'vitest'
import {
  formatPace,
  formatPaceWithUnit,
  paceSecPerKm,
  restTimeSec,
  speedKmh,
} from './pace'

describe('pace and speed', () => {
  it('calculates pace in seconds per km', () => {
    expect(paceSecPerKm(15, 7798)).toBeCloseTo(519.867, 3)
    expect(paceSecPerKm(5, 1500)).toBe(300)
  })

  it('returns null when data is missing or invalid', () => {
    expect(paceSecPerKm(0, 1000)).toBeNull()
    expect(paceSecPerKm(5, null)).toBeNull()
    expect(paceSecPerKm(5, 0)).toBeNull()
    expect(paceSecPerKm(null, 1000)).toBeNull()
  })

  it('formats pace as m:ss', () => {
    expect(formatPace(519.866)).toBe('8:40')
    expect(formatPace(300)).toBe('5:00')
    expect(formatPace(65)).toBe('1:05')
    expect(formatPace(null)).toBeNull()
    expect(formatPaceWithUnit(300)).toBe('5:00 /km')
  })

  it('calculates average speed', () => {
    expect(speedKmh(5, 1500)).toBeCloseTo(12, 5)
    expect(speedKmh(15, 7798)).toBeCloseTo(6.925, 3)
    expect(speedKmh(0, 1000)).toBeNull()
  })

  it('calculates stopped time', () => {
    expect(restTimeSec(8700, 7800)).toBe(900)
    expect(restTimeSec(null, 7800)).toBeNull()
    expect(restTimeSec(900, null)).toBeNull()
    expect(restTimeSec(800, 7800)).toBe(0)
  })
})
