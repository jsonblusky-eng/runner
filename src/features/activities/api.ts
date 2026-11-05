import { supabase } from '../../lib/supabase'
import type {
  ActivityFilters,
  ActivityPayload,
  ActivityRow,
} from '../../types/database'

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function listActivities(
  filters: ActivityFilters = {},
): Promise<ActivityRow[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.from) query = query.gte('activity_date', filters.from)
  if (filters.to) query = query.lte('activity_date', filters.to)
  if (filters.runType) query = query.eq('run_type', filters.runType)
  if (filters.search?.trim()) {
    query = query.ilike('notes', `%${escapeLike(filters.search.trim())}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchActivity(id: string): Promise<ActivityRow | null> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function createActivity(
  payload: ActivityPayload,
): Promise<ActivityRow> {
  const { data, error } = await supabase
    .from('activities')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateActivity(
  id: string,
  payload: ActivityPayload,
): Promise<ActivityRow> {
  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
