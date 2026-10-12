'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Dropdown, DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { getWorkspaceNavigation, getQuickActions, MOBILE_BOTTOM_NAV } from '@/lib/navigation'
import { CommandPalette } from '@/components/ui/CommandPalette'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  ClipboardList,
  FilePen,
  Library,
  IndianRupee,
  Megaphone,
  FileText,
  Settings,
  Building2,
  Shield,
  CreditCard,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  MessageSquare,
  User,
  LogOut,
  BookOpen,
  Award,
  Bookmark,
  HelpCircle,
  GraduationCap as GradCap,
  Settings as SettingsIcon,
} from 'lucide-react'

const NAV_ICONS: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Students: GraduationCap,
  Faculty: UserCheck,
  Attendance: CalendarCheck,
  Exams: ClipboardList,
  Assignments: FilePen,
  Library: Library,
  Fees: IndianRupee,
  Notices: Megaphone,
  Reports: FileText,
  Settings: SettingsIcon,
  'Admin Console': Shield,
  Colleges: Building2,
  Users: Users,
  Billing: CreditCard,
  Analytics: BarChart3,
  'My Classes': BookOpen,
  Marks: Award,
  LMS: Library,
  'Super Admin Dashboard': Shield,
  'College Management': Building2,
  'User Management': Users,
  'Role & Permission': Shield,
  'System Settings': SettingsIcon,
  'Platform Analytics': BarChart3,
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onToggleCollapse?: () => void
  collapsed?: boolean
}

export function Sidebar({ isOpen, onClose, onToggleCollapse, collapsed = false }: SidebarProps) {
  const { user, isAuthenticated } = useAuthStore()
  const pathname = usePathname()
  const [hovered, setHovered] = useState(false)

  if (!isAuthenticated || !user) return null

  const navItems = getWorkspaceNavigation(user.role)
  const quickActions = getQuickActions(user.role)
  const isSuperAdmin = user.role === 'Super Admin'
  const isCollegeAdmin = user.role === 'College Admin' || user.role === 'Super Admin'

  const getIcon = (iconName: string) => NAV_ICONS[iconName] || LayoutDashboard

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col',
          collapsed ? 'w-20' : 'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('flex h-16 items-center justify-between px-4 border-b border-slate-100', collapsed && 'justify-center')}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="font-semibold text-xl text-slate-900">EduOne</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex items-center justify-center" onClick={onClose}>
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation" aria-label="Main navigation">
          {isSuperAdmin && (
            <div className="mb-2">
              <h3 className={cn('px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider', collapsed && 'hidden')}>
                Platform Admin
              </h3>
              <div className="space-y-1">
                {[
                  { href: '/admin', icon: 'Shield', label: 'Admin Console', desc: 'Platform controls' },
                  { href: '/admin/colleges', icon: 'Building2', label: 'Colleges', desc: 'Manage institutions' },
                  { href: '/admin/users', icon: 'Users', label: 'Users', desc: 'Platform users' },
                  { href: '/admin/billing', icon: 'CreditCard', label: 'Billing', desc: 'Subscriptions' },
                  { href: '/admin/analytics', icon: 'BarChart3', label: 'Analytics', desc: 'Platform metrics' },
                  { href: '/admin/settings', icon: 'Settings', label: 'System Settings', desc: 'Global config' },
                ].map((item) => {
                  const Icon = getIcon(item.icon)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.label}</span>
                          <span className="text-xs text-slate-500 truncate block">{item.desc}</span>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div className={cn('mb-2', !isSuperAdmin && 'mt-2')}>
            <h3 className={cn('px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider', collapsed && 'hidden')}>
              {isSuperAdmin ? 'Modules' : 'Main Navigation'}
            </h3>
            <div className="space-y-1">
              {navItems
                .filter((item) => !['/admin', '/admin/colleges', '/admin/users', '/admin/billing', '/admin/analytics', '/admin/settings'].includes(item.href))
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.label}</span>
                          <span className="text-xs text-slate-500 truncate block">{item.description}</span>
                        </div>
                      )}
                    </Link>
                  )
                })}
            </div>
          </div>

          {isCollegeAdmin && (
            <>
              <div className="pt-4 pb-2 px-3">
                <h3 className={cn('text-xs font-semibold text-slate-500 uppercase tracking-wider', collapsed && 'hidden')}>Quick Actions</h3>
              </div>
              {quickActions.slice(0, 4).map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors',
                    collapsed && 'justify-center px-2'
                  )}
                  onClick={onClose}
                  title={collapsed ? action.label : undefined}
                >
                  <action.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{action.label}</span>}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className={cn('p-3 border-t border-slate-100', collapsed && 'hidden')}>
          <Link
            href="/modules/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <SettingsIcon className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="truncate block">Settings</span>
              <span className="text-xs text-slate-500 truncate block">Preferences & config</span>
            </div>
          </Link>
        </div>

        <div className={cn('p-3 border-t border-slate-100', collapsed && 'hidden')}>
          <Button
            variant="ghost"
            className="w-full justify-start px-3 py-2.5 rounded-xl"
            onClick={() => { useAuthStore.getState().clearAuth(); onClose(); }}
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="ml-3 text-red-600 font-medium">Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  )
}