import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../../components/BrandMark'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Field, Input } from '../../components/Field'
import { useToast } from '../../components/Toast'
import { loginSchema, type LoginFormValues } from '../../types/schemas'
import { useAuth } from './AuthProvider'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const allowSignup = import.meta.env.VITE_ALLOW_SIGNUP === 'true'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const destination =
    (location.state as { from?: string } | null)?.from ?? '/'

  if (session) {
    return <Navigate to={destination} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    try {
      if (mode === 'signin') {
        await signIn(values.email, values.password)
        navigate(destination, { replace: true })
      } else {
        const { needsConfirmation } = await signUp(values.email, values.password)
        if (needsConfirmation) {
          toast({
            title: 'Check your inbox',
            description:
              'Confirm your email, then come back and sign in. Tip: you can turn confirmation off in Supabase Auth settings.',
            variant: 'success',
            duration: 6000,
          })
          setMode('signin')
          reset({ email: values.email, password: '' })
        } else {
          navigate(destination, { replace: true })
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not sign in. Try again.'
      setError('root', { message })
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-6">
        <BrandMark />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Stride
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your runs, treks and lifts. Logged in seconds.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {mode === 'signin'
            ? 'Sign in to see your log and targets.'
            : 'One account, one private logbook.'}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root?.message ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {errors.root.message}
            </p>
          ) : null}

          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="At least 6 characters"
              {...register('password')}
            />
          </Field>

          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        {allowSignup ? (
          <button
            type="button"
            className="mt-4 min-h-11 w-full rounded-xl text-sm font-medium text-accent-700 hover:bg-accent-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:text-accent-300 dark:hover:bg-accent-950/40"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError('root', { message: '' })
            }}
          >
            {mode === 'signin'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'}
          </button>
        ) : (
          <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Account creation is disabled. Sign in with your personal account.
          </p>
        )}
      </Card>

      <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Private by design. Only your account can read its rows.
      </p>
    </div>
  )
}
