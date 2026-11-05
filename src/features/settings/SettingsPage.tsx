import { LogOut, Monitor, Moon, Smartphone, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { useToast } from '../../components/Toast'
import { useAuth } from '../auth/AuthProvider'
import { cn } from '../../lib/format'
import { humanizeError } from '../../lib/errors'
import { useTheme, type ThemeChoice } from '../../hooks/useTheme'

const themeOptions: Array<{
  value: ThemeChoice
  label: string
  icon: typeof Sun
}> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      toast({
        title: 'Could not sign out',
        description: humanizeError(error, 'Try again in a moment.'),
        variant: 'error',
      })
      setSigningOut(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="A few quiet preferences." backTo="/" />

      <div className="space-y-4">
        <Card>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Appearance
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Follow your phone, or pick a side.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
                    active
                      ? 'border-accent-600 bg-accent-50 text-accent-800 dark:border-accent-500 dark:bg-accent-950/40 dark:text-accent-200'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  )}
                  onClick={() => setTheme(option.value)}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Install on your phone
          </h2>
          <p className="mt-1 flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Open this site in your phone browser, then choose “Add to Home
            Screen” (iPhone: Share menu; Android: browser menu). It opens like an
            app and loads instantly.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Account
          </h2>
          <p className="mt-1 break-all text-sm text-zinc-500 dark:text-zinc-400">
            {user?.email ?? 'Signed in'}
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-3"
            loading={signingOut}
            onClick={() => {
              void handleSignOut()
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </Card>

        <p className="px-1 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Week start, units, export and offline sync arrive in Phase 3.
        </p>
      </div>
    </div>
  )
}
