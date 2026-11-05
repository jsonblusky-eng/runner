import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  formatDurationShort,
  formatInputDuration,
  formatMinutes,
  parseTimeInput,
} from './time'

describe('parseTimeInput', () => {
  it('parses h:mm:ss', () => {
    expect(parseTimeInput('2:09:58')).toEqual({ ok: true, seconds: 7798 })
    expect(parseTimeInput('0:45:30')).toEqual({ ok: true, seconds: 2730 })
  })

  it('parses mm:ss', () => {
    expect(parseTimeInput('45:30')).toEqual({ ok: true, seconds: 2730 })
    expect(parseTimeInput('5:00')).toEqual({ ok: true, seconds: 300 })
  })

  it('parses plain minutes, including decimals and commas', () => {
    expect(parseTimeInput('45')).toEqual({ ok: true, seconds: 2700 })
    expect(parseTimeInput('45.5')).toEqual({ ok: true, seconds: 2730 })
    expect(parseTimeInput('45,5')).toEqual({ ok: true, seconds: 2730 })
    expect(parseTimeInput(' 45 ')).toEqual({ ok: true, seconds: 2700 })
  })

  it('rejects invalid input with a readable message', () => {
    expect(parseTimeInput('')).toMatchObject({ ok: false })
    expect(parseTimeInput('abc')).toMatchObject({ ok: false })
    expect(parseTimeInput('1:60')).toEqual({
      ok: false,
      error: 'Seconds must be between 0 and 59.',
    })
    expect(parseTimeInput('1:60:00')).toEqual({
      ok: false,
      error: 'Minutes must be between 0 and 59.',
    })
    expect(parseTimeInput('1:00:60')).toEqual({
      ok: false,
      error: 'Seconds must be between 0 and 59.',
    })
    expect(parseTimeInput('1:2:3:4')).toMatchObject({ ok: false })
  })
})

describe('formatDuration', () => {
  it('uses h:mm:ss at one hour or more', () => {
    expect(formatDuration(7798)).toBe('2:09:58')
    expect(formatDuration(3600)).toBe('1:00:00')
    expect(formatDuration(3601)).toBe('1:00:01')
  })

  it('uses m:ss below one hour', () => {
    expect(formatDuration(2730)).toBe('45:30')
    expect(formatDuration(300)).toBe('5:00')
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(3599)).toBe('59:59')
  })

  it('formats short human durations', () => {
    expect(formatDurationShort(7200)).toBe('2h')
    expect(formatDurationShort(4500)).toBe('1h 15m')
    expect(formatDurationShort(1800)).toBe('30m')
    expect(formatDurationShort(45)).toBe('45s')
  })

  it('formats goal minutes', () => {
    expect(formatMinutes(30)).toBe('30 min')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(75)).toBe('1h 15m')
  })

  it('formats stored seconds for an input field', () => {
    expect(formatInputDuration(7798)).toBe('2:09:58')
    expect(formatInputDuration(null)).toBe('')
  })
})
