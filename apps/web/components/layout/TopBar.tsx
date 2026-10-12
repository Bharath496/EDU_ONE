'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'
import { getQuickActions } from '@/lib/navigation'

interface TopBarProps {
  onMenuClick: () => void
  children?: ReactNode
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const fees = useEduStore((state) => state.fees)
  const notices = useEduStore((state) => state.notices)
  const [searchOpen, setSearchOpen] = useState(false)

  if (!isAuthenticated || !user) return null

  const quickActions = getQuickActions(user.role)
  const alertCount =
    students.filter((item) => item.attendance < 75 || item.cgpa < 6).length +
    fees.filter((item) => item.status === 'overdue').length +
    notices.filter((item) => item.priority === 'urgent' || item.priority === 'high').length

  const signOut = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-6 w-6" />
        </Button>

        <div className="min-w-0 flex-1">
          <CommandPalette
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-full max-w-md justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                onClick={() => setSearchOpen(true)}
                type="button"
              >
                <Search className="h-4 w-4 text-slate-400" />
                <span className="truncate text-sm">Search modules and actions</span>
                <span className="ml-auto hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">Ctrl K</span>
              </Button>
            }
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          >
            <CommandPalette.Section label="Navigation">
              <CommandPalette.Item href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
              <CommandPalette.Item href="/modules/students" label="Students" icon={<GraduationCap className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
              <CommandPalette.Item href="/modules/faculty" label="Faculty" icon={<UserCheck className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
              <CommandPalette.Item href="/modules/attendance" label="Attendance" icon={<CalendarCheck className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
              <CommandPalette.Item href="/modules/fees" label="Fees" icon={<IndianRupee className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
              <CommandPalette.Item href="/modules/student-intelligence" label="Student Intelligence" icon={<Sparkles className="h-4 w-4" />} onSelect={() => setSearchOpen(false)} />
            </CommandPalette.Section>
            <CommandPalette.Section label="Role actions">
              {quickActions.slice(0, 5).map((action) => (
                <CommandPalette.Item
                  key={action.href}
                  href={action.href}
                  label={action.label}
                  description={action.description}
                  icon={<action.icon className="h-4 w-4" />}
                  onSelect={() => setSearchOpen(false)}
                />
              ))}
            </CommandPalette.Section>
          </CommandPalette>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/modules/alerts">
            <Button variant="ghost" size="icon" className="relative" aria-label="Open alerts">
              <Bell className="h-5 w-5 text-slate-600" />
              {alertCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Button>
          </Link>

          <Dropdown
            trigger={
              <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2">
                <Avatar name={user.name} size="sm" src={user.avatar} status="online" />
                <div className="hidden max-w-36 text-left lg:block">
                  <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user.role}</p>
                </div>
              </Button>
            }
            content={
              <DropdownMenu label="Account">
                <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => router.push('/modules/profile')}>
                  Profile
                </DropdownItem>
                <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={() => router.push('/modules/settings')}>
                  Settings
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onClick={signOut}>
                  Sign out
                </DropdownItem>
              </DropdownMenu>
            }
            align="right"
          />
        </div>
      </div>
    </header>
  )
}
