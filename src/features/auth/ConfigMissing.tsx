import { BrandMark } from '../../components/BrandMark'
import { Card } from '../../components/Card'

export function ConfigMissing() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <BrandMark />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Connect Supabase
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Stride needs your Supabase project URL and anon key before it can sign in
        or store activities.
      </p>

      <Card className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            1. Create a Supabase project
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Then run the SQL in{' '}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
              supabase/schema.sql
            </code>{' '}
            in the SQL editor.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            2. Add environment variables
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Create <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">.env.local</code>{' '}
            (copy <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">.env.example</code>):
          </p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-100">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ALLOW_SIGNUP=true`}
          </pre>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            3. Restart the dev server
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Set <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">VITE_ALLOW_SIGNUP</code>{' '}
            back to false after creating your account.
          </p>
        </div>
      </Card>
    </div>
  )
}
