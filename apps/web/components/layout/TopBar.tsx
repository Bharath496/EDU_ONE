'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Dropdown, DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown'
import { useAuthStore } from '@/lib/auth-store'
import { getQuickActions } from '@/lib/navigation'
import { CommandPalette } from '@/components/ui/CommandPalette'
import {
  Bell,
  MessageSquare,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  Globe,
  Building2,
  ChevronDown,
  Plus,
  Settings,
  Shield,
  Bookmark,
  HelpCircle,
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  IndianRupee,
  Megaphone,
  FileText,
  Menu,
  X,
} from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
  children?: ReactNode
}

export function TopBar({ onMenuClick, children }: TopBarProps) {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const pathname = usePathname()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  if (!isAuthenticated || !user) return null

  const quickActions = getQuickActions(user.role)
  const isSuperAdmin = user.role === 'Super Admin'

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 flex items-center gap-4 max-w-2xl">
          <CommandPalette
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full lg:w-72 h-10 justify-start gap-2',
                  'bg-slate-50 hover:bg-slate-100 text-slate-600',
                  'rounded-xl border border-slate-200'
                )}
                onClick={() => setSearchOpen(true)}
                type="button"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">Search (⌘K)</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
              </Button>
            }
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          >
            <CommandPalette.Section label="Navigation">
              <CommandPalette.Item href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />
              <CommandPalette.Item href="/modules/students" label="Students" icon={<GraduationCap className="w-4 h-4" />} />
              <CommandPalette.Item href="/modules/faculty" label="Faculty" icon={<UserCheck className="w-4 h-4" />} />
              <CommandPalette.Item href="/modules/attendance" label="Attendance" icon={<CalendarCheck className="w-4 h-4" />} />
              <CommandPalette.Item href="/modules/fees" label="Fees" icon={<IndianRupee className="w-4 h-4" />} />
              <CommandPalette.Item href="/modules/notices" label="Notices" icon={<Megaphone className="w-4 h-4" />} />
            </CommandPalette.Section>
            <CommandPalette.Section label="Quick Actions">
              {quickActions.slice(0, 4).map((action) => (
                <CommandPalette.Item key={action.href} href={action.href} label={action.label} icon={null} />
              ))}
            </CommandPalette.Section>
          </CommandPalette>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <Dropdown
            trigger={
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            }
            content={
              <DropdownMenu>
                <DropdownItem icon={<Bell className="w-4 h-4" />} onClick={() => setNotificationsOpen(true)}>
                  Notifications
                  <Badge variant="primary" className="ml-auto">3</Badge>
                </DropdownItem>
                <DropdownItem icon={<MessageSquare className="w-4 h-4" />} onClick={() => setMessagesOpen(true)}>
                  Messages
                  <Badge variant="success" className="ml-auto">1</Badge>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<Building2 className="w-4 h-4" />}>Switch Institution</DropdownItem>
                <DropdownItem icon={<Globe className="w-4 h-4" />}>Language</DropdownItem>
                <DropdownItem icon={<Moon className="w-4 h-4" />}>Dark Mode</DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/profile'; }}>
                  Profile
                </DropdownItem>
                <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/settings'; }}>
                  Settings
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={clearAuth}>
                  Sign Out
                </DropdownItem>
              </DropdownMenu>
            }
            align="right"
          />

          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
          </Button>

          {isSuperAdmin && (
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon" className="relative">
                  <Shield className="w-5 h-5 text-primary-600" />
                </Button>
              }
              content={
                <DropdownMenu>
                  <DropdownItem icon={<Shield className="w-4 h-4" />} onClick={() => { window.location.href = '/admin'; }}>
                    Admin Console
                  </DropdownItem>
                  <DropdownItem icon={<Building2 className="w-4 h-4" />} onClick={() => { window.location.href = '/admin/colleges/new'; }}>
                    Add Institution
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/profile'; }}>
                    Profile
                  </DropdownItem>
                  <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/settings'; }}>
                    Settings
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={clearAuth}>
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              }
              align="right"
            />
          )}

          <Dropdown
            trigger={
              <Button variant="ghost" size="icon" className="relative p-1">
                <Avatar name={user.name} size="sm" src={user.avatar} status="online" />
              </Button>
            }
            content={
              <DropdownMenu>
                <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/profile'; }}>
                  Profile
                </DropdownItem>
                <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => { window.location.href = '/modules/settings'; }}>
                  Settings
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={<LogOut className="w-4 h-4" />} danger onClick={clearAuth}>
                  Sign Out
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