export type ParseTimeResult =
  | { ok: true; seconds: number }
  | { ok: false; error: string }

const plainMinutes = /^\d+(?:[.,]\d+)?$/
const colonTime = /^\d+:\d{1,2}(?::\d{1,2})?$/

export function parseTimeInput(input: string): ParseTimeResult {
  const value = input.trim()

  if (value === '') {
    return { ok: false, error: 'Enter a time, e.g. 45:30.' }
  }

  if (plainMinutes.test(value)) {
    const minutes = Number(value.replace(',', '.'))
    if (!Number.isFinite(minutes) || minutes < 0) {
      return { ok: false, error: 'Enter a valid time.' }
    }
    return { ok: true, seconds: Math.round(minutes * 60) }
  }

  if (!colonTime.test(value)) {
    return {
      ok: false,
      error: 'Use h:mm:ss, mm:ss, or minutes, e.g. 2:09:58.',
    }
  }

  const parts = value.split(':').map((part) => Number(part))

  if (parts.some((part) => !Number.isInteger(part) || part < 0)) {
    return { ok: false, error: 'Enter a valid time.' }
  }

  if (parts.length === 2) {
    const [minutes = 0, seconds = 0] = parts
    if (seconds >= 60) {
      return { ok: false, error: 'Seconds must be between 0 and 59.' }
    }
    return { ok: true, seconds: minutes * 60 + seconds }
  }

  if (parts.length === 3) {
    const [hours = 0, minutes = 0, seconds = 0] = parts
    if (minutes >= 60) {
      return { ok: false, error: 'Minutes must be between 0 and 59.' }
    }
    if (seconds >= 60) {
      return { ok: false, error: 'Seconds must be between 0 and 59.' }
    }
    return { ok: true, seconds: hours * 3600 + minutes * 60 + seconds }
  }

  return { ok: false, error: 'Use h:mm:ss, mm:ss, or minutes, e.g. 2:09:58.' }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`
  }
  return `${minutes}:${pad(secs)}`
}

export function formatDurationShort(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  if (total < 60) return `${total}s`
  return `${minutes}m`
}

export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

export function formatInputDuration(seconds: number | null): string {
  return seconds === null ? '' : formatDuration(seconds)
}
