import { formatNumber } from './format'

export function paceSecPerKm(
  distanceKm: number | null | undefined,
  movingTimeSec: number | null | undefined,
): number | null {
  if (!distanceKm || distanceKm <= 0) return null
  if (!movingTimeSec || movingTimeSec <= 0) return null
  return movingTimeSec / distanceKm
}

export function speedKmh(
  distanceKm: number | null | undefined,
  movingTimeSec: number | null | undefined,
): number | null {
  if (!distanceKm || distanceKm <= 0) return null
  if (!movingTimeSec || movingTimeSec <= 0) return null
  return distanceKm / (movingTimeSec / 3600)
}

export function restTimeSec(
  totalTimeSec: number | null | undefined,
  movingTimeSec: number | null | undefined,
): number | null {
  if (totalTimeSec === null || totalTimeSec === undefined) return null
  if (movingTimeSec === null || movingTimeSec === undefined) return null
  return Math.max(0, totalTimeSec - movingTimeSec)
}

export function formatPace(secondsPerKm: number | null | undefined): string | null {
  if (secondsPerKm === null || secondsPerKm === undefined) return null
  if (!Number.isFinite(secondsPerKm) || secondsPerKm < 0) return null

  const total = Math.round(secondsPerKm)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatPaceWithUnit(
  secondsPerKm: number | null | undefined,
): string | null {
  const pace = formatPace(secondsPerKm)
  return pace === null ? null : `${pace} /km`
}

export function formatSpeed(
  distanceKm: number | null | undefined,
  movingTimeSec: number | null | undefined,
): string | null {
  const speed = speedKmh(distanceKm, movingTimeSec)
  return speed === null ? null : `${formatNumber(speed, 1)} km/h`
}
