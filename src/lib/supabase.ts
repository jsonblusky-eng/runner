import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const isSupabaseConfigured =
  url.length > 0 &&
  anonKey.length > 0 &&
  !url.includes('YOUR_PROJECT') &&
  !anonKey.includes('YOUR_ANON_KEY')

export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }
}
