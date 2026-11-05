import { forwardRef, type ReactNode } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/format'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
        {optional ? (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">optional</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  )
}

const inputClasses =
  'w-full min-h-12 rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClasses, className)} {...props} />
  },
)

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputClasses, 'min-h-24 py-3', className)}
      {...props}
    />
  )
})
