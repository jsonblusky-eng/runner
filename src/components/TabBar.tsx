import { House, ListOrdered, Plus, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/format'

const tabs = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/log', label: 'Log', icon: Plus, end: false, emphasis: true },
  { to: '/history', label: 'History', icon: ListOrdered, end: false },
  { to: '/goals', label: 'Goals', icon: Target, end: false },
]

export function TabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset',
                  isActive
                    ? 'text-accent-700 dark:text-accent-300'
                    : 'text-zinc-500 dark:text-zinc-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {tab.emphasis ? (
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition-colors',
                        isActive
                          ? 'bg-accent-700'
                          : 'bg-accent-600',
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  )}
                  <span className={tab.emphasis ? 'mt-0.5' : undefined}>{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
