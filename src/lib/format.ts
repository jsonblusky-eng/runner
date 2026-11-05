export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatKm(value: number): string {
  return `${formatNumber(value, 1)} km`
}

export function formatMeters(value: number): string {
  return `${formatNumber(Math.round(value), 0)} m`
}
