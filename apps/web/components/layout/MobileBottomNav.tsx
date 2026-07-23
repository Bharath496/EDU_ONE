'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MOBILE_BOTTOM_NAV } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { LayoutDashboard } from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) return null

  const navItems = MOBILE_BOTTOM_NAV

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon || LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors',
                isActive
                  ? 'text-primary-600'
                  : 'text-slate-500 active:text-slate-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn('w-6 h-6', isActive && 'fill-current')} strokeWidth={2.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}