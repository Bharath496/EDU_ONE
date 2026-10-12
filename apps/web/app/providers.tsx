'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'

export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return <>{children}</>
}
