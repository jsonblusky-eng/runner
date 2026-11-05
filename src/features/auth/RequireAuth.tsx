import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <BrandMark className="h-14 w-14" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your log…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
