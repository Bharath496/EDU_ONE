'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useAuthStore } from '@/lib/auth-store'
import { getWorkspaceNavigation } from '@/lib/navigation'

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) setSidebarCollapsed(JSON.parse(saved))
    } catch {
      setSidebarCollapsed(false)
    }
  }, [])

  const allowed = Boolean(
    user &&
      (
        pathname === '/dashboard' ||
        getWorkspaceNavigation(user.role).some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/')
        )
      )
  )

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) {
      router.replace('/')
      return
    }
    if (!allowed) router.replace('/dashboard')
  }, [allowed, isAuthenticated, isLoading, router, user])

  if (isLoading || !isAuthenticated || !user || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white">E</div>
          <p className="mt-3 text-sm text-slate-500">
            {!isLoading && isAuthenticated && user && !allowed ? 'Returning to your workspace...' : 'Loading EDU_ONE...'}
          </p>
        </div>
      </div>
    )
  }

  const toggleCollapse = () => {
    const next = !sidebarCollapsed
    setSidebarCollapsed(next)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleCollapse}
        collapsed={sidebarCollapsed}
      />
      <div
        className={`min-h-screen transition-all duration-300 lg:pl-72 ${
          sidebarCollapsed ? 'lg:pl-20' : ''
        }`}
      >
        <TopBar onMenuClick={() => setSidebarOpen((value) => !value)} />
        <main className="pb-20 lg:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
