import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from './Toast'

export function ReloadPrompt() {
  const { toast } = useToast()
  const shown = useRef(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!needRefresh || shown.current) return
    shown.current = true
    toast({
      title: 'Update available',
      description: 'A new version of Stride is ready.',
      variant: 'info',
      duration: 10000,
      action: {
        label: 'Reload',
        onClick: () => {
          setNeedRefresh(false)
          void updateServiceWorker(true)
        },
      },
    })
  }, [needRefresh, setNeedRefresh, toast, updateServiceWorker])

  return null
}
