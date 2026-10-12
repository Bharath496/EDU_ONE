'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getMobileNavigation } from '@/lib/navigation'
import { useAuthStore } from '@/lib/auth-store'
import { LayoutDashboard } from 'lucide-react'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) return null

  const navItems = getMobileNavigation(user.role).slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon || LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-3 transition-colors',
                isActive ? 'text-primary-600' : 'text-slate-500 active:text-slate-700'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={2.3} />
              <span className="max-w-full truncate text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
