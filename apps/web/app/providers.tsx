'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { PwaRegister } from '@/components/PwaRegister'

export function Providers({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return <><PwaRegister />{children}</>
}
