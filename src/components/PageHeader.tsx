import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="mb-5 flex items-start gap-3">
      {backTo !== undefined ? (
        <button
          type="button"
          aria-label="Go back"
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
