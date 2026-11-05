import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ActivityFilters,
  ActivityPayload,
  ActivityRow,
} from '../../types/database'
import { formatInputDuration } from '../../lib/time'
import type { ActivityFormValues } from '../../types/schemas'
import {
  createActivity,
  deleteActivity,
  fetchActivity,
  listActivities,
  updateActivity,
} from './api'

export const activityKeys = {
  all: ['activities'] as const,
  lists: ['activities', 'list'] as const,
  list: (filters: ActivityFilters) => ['activities', 'list', filters] as const,
  detail: (id: string) => ['activities', 'detail', id] as const,
  overview: ['activities', 'overview'] as const,
}

export function useActivities(filters: ActivityFilters) {
  return useQuery({
    queryKey: activityKeys.list(filters),
    queryFn: () => listActivities(filters),
  })
}

export function useOverviewActivities() {
  return useQuery({
    queryKey: activityKeys.overview,
    queryFn: () => listActivities(),
  })
}

export function useActivity(id: string | undefined) {
  return useQuery({
    queryKey: activityKeys.detail(id ?? 'missing'),
    queryFn: () => fetchActivity(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity)
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useUpdateActivity(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ActivityPayload) => updateActivity(id, payload),
    onSuccess: (activity) => {
      queryClient.setQueryData(activityKeys.detail(activity.id), activity)
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteActivity,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: activityKeys.all })
      const snapshots = queryClient.getQueriesData<ActivityRow[]>({
        queryKey: activityKeys.all,
      })

      snapshots.forEach(([key, rows]) => {
        if (!Array.isArray(rows)) return
        queryClient.setQueryData<ActivityRow[]>(
          key,
          rows.filter((row) => row.id !== id),
        )
      })

      return { snapshots }
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, rows]) => {
        queryClient.setQueryData(key, rows)
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function activityToPayload(activity: ActivityRow): ActivityPayload {
  return {
    activity_date: activity.activity_date,
    type: activity.type,
    distance_km: activity.distance_km,
    moving_time_sec: activity.moving_time_sec,
    total_time_sec: activity.total_time_sec,
    elevation_m: activity.elevation_m,
    run_type: activity.run_type,
    exercise_name: activity.exercise_name,
    sets: activity.sets,
    effort: activity.effort,
    notes: activity.notes,
  }
}

export function activityToFormDefaults(
  activity: ActivityRow,
): ActivityFormValues {
  return {
    type: activity.type,
    activity_date: activity.activity_date,
    distance_km:
      activity.distance_km === null ? '' : String(activity.distance_km),
    moving_time: formatInputDuration(activity.moving_time_sec),
    total_time: formatInputDuration(activity.total_time_sec),
    elevation_m: activity.elevation_m === null ? '' : String(activity.elevation_m),
    run_type: activity.run_type ?? '',
    exercise_name: activity.exercise_name ?? '',
    sets: activity.sets === null ? '' : String(activity.sets),
    effort: activity.effort,
    notes: activity.notes ?? '',
  }
}
