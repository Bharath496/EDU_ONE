'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth-store'
import { getQuickActions, getWorkspaceNavigation } from '@/lib/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onToggleCollapse: () => void
  collapsed: boolean
}

export function Sidebar({ isOpen, onClose, onToggleCollapse, collapsed }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  if (!user) return null

  const navigation = getWorkspaceNavigation(user.role)
  const quickActions = getQuickActions(user.role)

  const signOut = () => {
    clearAuth()
    onClose()
    router.push('/')
  }

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300',
          collapsed ? 'w-20' : 'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white">
              E
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate font-bold tracking-tight text-slate-950">EDU_ONE</p>
                <p className="truncate text-[11px] text-slate-400">College OS Demo</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Workspace
            </p>
          )}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary-600')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {quickActions.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Quick actions
                </p>
              )}
              <div className="space-y-1">
                {quickActions.slice(0, 4).map((action) => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    onClick={onClose}
                    title={collapsed ? action.label : undefined}
                    className={cn(
                      'flex items-center rounded-xl text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900',
                      collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2'
                    )}
                  >
                    <action.icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && <span className="truncate">{action.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-3">
          {!collapsed ? (
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="sm" src={user.avatar} status="online" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar name={user.name} size="sm" src={user.avatar} status="online" />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={cn('mt-2 hidden w-full text-slate-500 lg:flex', collapsed ? 'justify-center px-0' : 'justify-between')}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!collapsed && <span>Collapse</span>}
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </>
  )
}
