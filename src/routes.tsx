import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './features/auth/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { AppLayout } from './features/layout/AppLayout'

const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)

const ActivityFormPage = lazy(() =>
  import('./features/activities/ActivityFormPage').then((module) => ({
    default: module.ActivityFormPage,
  })),
)

const ActivityDetailPage = lazy(() =>
  import('./features/activities/ActivityDetailPage').then((module) => ({
    default: module.ActivityDetailPage,
  })),
)

const HistoryPage = lazy(() =>
  import('./features/activities/HistoryPage').then((module) => ({
    default: module.HistoryPage,
  })),
)

const GoalsPage = lazy(() =>
  import('./features/goals/GoalsPage').then((module) => ({
    default: module.GoalsPage,
  })),
)

const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="log" element={<ActivityFormPage />} />
          <Route path="log/:id" element={<ActivityFormPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<ActivityDetailPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
