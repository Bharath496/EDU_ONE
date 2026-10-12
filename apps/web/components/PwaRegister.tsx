'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const basePath = window.location.pathname.startsWith('/EDU_ONE') ? '/EDU_ONE' : ''
    const register = async () => {
      try {
        await navigator.serviceWorker.register(`${basePath}/sw.js`, {
          scope: `${basePath || ''}/`,
        })
      } catch {
        // The app remains fully usable without service-worker support.
      }
    }

    void register()
  }, [])

  return null
}
