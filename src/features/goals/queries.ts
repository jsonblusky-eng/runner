import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GoalInsert, GoalUpdate } from '../../types/database'
import { createGoal, deleteGoal, listGoals, updateGoal } from './api'

export const goalKeys = {
  all: ['goals'] as const,
  list: ['goals', 'list'] as const,
}

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.list,
    queryFn: listGoals,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: GoalInsert) => createGoal(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GoalUpdate }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}
