export const ACTIVITY_TYPES = [
  'run',
  'strength',
  'trek',
  'walk',
  'cycling',
  'other',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const RUN_TYPES = [
  'easy',
  'long',
  'tempo',
  'hill',
  'race',
  'recovery',
] as const

export type RunType = (typeof RUN_TYPES)[number]

export const GOAL_PERIODS = ['daily', 'weekly', 'monthly'] as const
export type GoalPeriod = (typeof GOAL_PERIODS)[number]

export const GOAL_METRICS = [
  'distance_km',
  'duration_min',
  'sessions',
  'elevation_m',
] as const
export type GoalMetric = (typeof GOAL_METRICS)[number]

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  strength: 'Strength',
  trek: 'Trek',
  walk: 'Walk',
  cycling: 'Cycling',
  other: 'Other',
}

export const RUN_TYPE_LABELS: Record<RunType, string> = {
  easy: 'Easy',
  long: 'Long',
  tempo: 'Tempo',
  hill: 'Hill',
  race: 'Race',
  recovery: 'Recovery',
}

export const PERIOD_LABELS: Record<GoalPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export const METRIC_LABELS: Record<GoalMetric, string> = {
  distance_km: 'Distance',
  duration_min: 'Duration',
  sessions: 'Sessions',
  elevation_m: 'Elevation',
}

export type ActivityRow = {
  id: string
  user_id: string
  activity_date: string
  type: ActivityType
  distance_km: number | null
  moving_time_sec: number | null
  total_time_sec: number | null
  elevation_m: number | null
  run_type: RunType | null
  effort: number | null
  exercise_name: string | null
  sets: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ActivityInsert = {
  id?: string
  user_id?: string
  activity_date?: string
  type: ActivityType
  distance_km?: number | null
  moving_time_sec?: number | null
  total_time_sec?: number | null
  elevation_m?: number | null
  run_type?: RunType | null
  effort?: number | null
  exercise_name?: string | null
  sets?: number | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type ActivityUpdate = Partial<ActivityInsert>

export type GoalRow = {
  id: string
  user_id: string
  period: GoalPeriod
  metric: GoalMetric
  activity_type: ActivityType | null
  target_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GoalInsert = {
  id?: string
  user_id?: string
  period: GoalPeriod
  metric: GoalMetric
  activity_type?: ActivityType | null
  target_value: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type GoalUpdate = Partial<GoalInsert>

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: ActivityRow
        Insert: ActivityInsert
        Update: ActivityUpdate
        Relationships: []
      }
      goals: {
        Row: GoalRow
        Insert: GoalInsert
        Update: GoalUpdate
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export interface ActivityFilters {
  type?: ActivityType
  from?: string
  to?: string
  runType?: RunType
  search?: string
}

export type ActivityPayload = Omit<
  ActivityInsert,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
