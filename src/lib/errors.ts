export function humanizeError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim()
    if (!message) return fallback
    if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
      return 'Network error. Check your connection and try again.'
    }
    return message
  }
  return fallback
}
