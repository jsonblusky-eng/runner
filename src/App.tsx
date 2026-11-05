import { ReloadPrompt } from './components/ReloadPrompt'
import { ConfigMissing } from './features/auth/ConfigMissing'
import { isSupabaseConfigured } from './lib/supabase'
import { AppRoutes } from './routes'

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigMissing />
  }

  return (
    <>
      <AppRoutes />
      <ReloadPrompt />
    </>
  )
}
