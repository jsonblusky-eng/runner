import { useEffect, useState } from 'react'

export function useNow(refreshMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), refreshMs)
    return () => window.clearInterval(timer)
  }, [refreshMs])

  return now
}
