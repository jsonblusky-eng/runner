import { supabase } from '../../lib/supabase'
import type { GoalInsert, GoalRow, GoalUpdate } from '../../types/database'

export async function listGoals(): Promise<GoalRow[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createGoal(payload: GoalInsert): Promise<GoalRow> {
  const { data, error } = await supabase
    .from('goals')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateGoal(
  id: string,
  payload: GoalUpdate,
): Promise<GoalRow> {
  const { data, error } = await supabase
    .from('goals')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
