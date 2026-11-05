import { CloudOff } from 'lucide-react'
import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageFallback } from '../../components/PageFallback'
import { TabBar } from '../../components/TabBar'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function AppLayout() {
  const online = useOnlineStatus()

  return (
    <div className="min-h-dvh">
      {!online ? (
        <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <span className="inline-flex items-center gap-1.5">
            <CloudOff className="h-4 w-4" aria-hidden="true" />
            You are offline. Your form is kept, but saving needs a connection.
          </span>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-5">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
    </div>
  )
}
