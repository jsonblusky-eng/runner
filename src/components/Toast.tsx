import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../lib/format'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-accent-200 bg-white text-zinc-900 dark:border-accent-800 dark:bg-zinc-900 dark:text-zinc-100',
  error:
    'border-red-200 bg-white text-zinc-900 dark:border-red-900 dark:bg-zinc-900 dark:text-zinc-100',
  info: 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
}

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <CircleCheck className="h-5 w-5 text-accent-600 dark:text-accent-400" />,
  error: <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />,
  info: <Info className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-2), { ...options, id }])
      const duration = options.duration ?? (options.action ? 6000 : 3500)
      const timer = window.setTimeout(() => dismiss(id), duration)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const savedTimers = timers.current
    return () => {
      savedTimers.forEach((timer) => window.clearTimeout(timer))
      savedTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+9rem)] z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-3 shadow-lg motion-safe:animate-toast-in',
              variantStyles[item.variant ?? 'info'],
            )}
          >
            <div className="mt-0.5 shrink-0">{variantIcons[item.variant ?? 'info']}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
              ) : null}
              {item.action ? (
                <button
                  type="button"
                  className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-accent-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-accent-300"
                  onClick={() => {
                    item.action?.onClick()
                    dismiss(item.id)
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => dismiss(item.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return context
}
