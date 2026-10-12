import type { NavItem, QuickAction } from './types'
import {
  LayoutDashboard,
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
  Shield,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  BookOpen,
  Award,
  Bell,
  Plus,
  User,
} from 'lucide-react'

export const GLOBAL_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview and current priorities' },
  { label: 'Students', href: '/modules/students', icon: GraduationCap, description: 'Student records and academic profile data' },
  { label: 'Faculty', href: '/modules/faculty', icon: UserCheck, description: 'Faculty directory and teaching staff' },
  { label: 'My Classes', href: '/modules/my-classes', icon: BookOpen, description: 'Weekly class schedule' },
  { label: 'Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Attendance sessions and history' },
  { label: 'Exams', href: '/modules/exams', icon: ClipboardList, description: 'Exam schedules and assessment workflows' },
  { label: 'Assignments', href: '/modules/assignments', icon: FilePen, description: 'Coursework and submission progress' },
  { label: 'Marks', href: '/modules/marks', icon: Award, description: 'Marks, grades and pass status' },
  { label: 'Library', href: '/modules/library', icon: Library, description: 'Catalog and inventory workflows' },
  { label: 'Fees', href: '/modules/fees', icon: IndianRupee, description: 'Fee ledger and payment status' },
  { label: 'Notices', href: '/modules/notices', icon: Megaphone, description: 'Announcements and communication' },
  { label: 'Alerts', href: '/modules/alerts', icon: Bell, description: 'Cross-module alerts and reminders' },
  { label: 'Reports', href: '/modules/reports', icon: FileText, description: 'CSV exports and summaries' },
  { label: 'Student Intelligence', href: '/modules/student-intelligence', icon: BarChart3, description: 'Explainable academic-risk monitoring' },
  { label: 'Profile', href: '/modules/profile', icon: User, description: 'Demo account profile' },
  { label: 'Settings', href: '/modules/settings', icon: Settings, description: 'Preferences, backup and restore' },
]

export const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Console', href: '/admin', icon: Shield, description: 'Platform demo overview' },
  { label: 'Institutions', href: '/admin/colleges', icon: Building2, description: 'Manage fictional demo tenants' },
  { label: 'Platform Users', href: '/admin/users', icon: Users, description: 'Manage demo platform users' },
  { label: 'Plans', href: '/admin/billing', icon: CreditCard, description: 'Illustrative plan ledger' },
  { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Demo tenant and user analytics' },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings, description: 'Local platform-demo controls' },
]

const byHref = (hrefs: string[]) => GLOBAL_NAV.filter((item) => hrefs.includes(item.href))

export function getWorkspaceNavigation(role: string): NavItem[] {
  if (role === 'Super Admin') {
    return [...ADMIN_NAV, ...byHref(['/dashboard', '/modules/reports', '/modules/profile', '/modules/settings'])]
  }
  if (role === 'College Admin') return GLOBAL_NAV
  if (role === 'Faculty') {
    return byHref([
      '/dashboard',
      '/modules/my-classes',
      '/modules/students',
      '/modules/attendance',
      '/modules/exams',
      '/modules/assignments',
      '/modules/marks',
      '/modules/library',
      '/modules/notices',
      '/modules/alerts',
      '/modules/reports',
      '/modules/student-intelligence',
      '/modules/profile',
      '/modules/settings',
    ])
  }
  if (role === 'Student') {
    return byHref([
      '/dashboard',
      '/modules/attendance',
      '/modules/exams',
      '/modules/assignments',
      '/modules/marks',
      '/modules/library',
      '/modules/fees',
      '/modules/notices',
      '/modules/alerts',
      '/modules/profile',
      '/modules/settings',
    ])
  }
  if (role === 'Parent') {
    return byHref([
      '/dashboard',
      '/modules/attendance',
      '/modules/marks',
      '/modules/fees',
      '/modules/notices',
      '/modules/alerts',
      '/modules/profile',
      '/modules/settings',
    ])
  }
  return byHref(['/dashboard', '/modules/profile', '/modules/settings'])
}

export function getQuickActions(role: string): QuickAction[] {
  const actions: Record<string, QuickAction[]> = {
    'Super Admin': [
      { label: 'Add Institution', href: '/admin/colleges', icon: Plus, description: 'Open the functional tenant manager' },
      { label: 'Platform Users', href: '/admin/users', icon: Users, description: 'Manage demo users' },
      { label: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Inspect demo platform metrics' },
    ],
    'College Admin': [
      { label: 'Open Students', href: '/modules/students', icon: GraduationCap, description: 'Manage student records' },
      { label: 'Mark Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Open attendance workspace' },
      { label: 'Publish Notice', href: '/modules/notices', icon: Megaphone, description: 'Open announcement publisher' },
      { label: 'Run Reports', href: '/modules/reports', icon: FileText, description: 'Export current workspace data' },
    ],
    Faculty: [
      { label: 'My Classes', href: '/modules/my-classes', icon: BookOpen, description: 'View class schedule' },
      { label: 'Mark Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Open attendance workspace' },
      { label: 'Create Assignment', href: '/modules/assignments', icon: FilePen, description: 'Open assignment creator' },
      { label: 'Enter Marks', href: '/modules/marks', icon: Award, description: 'Edit marks and grades' },
    ],
    Student: [
      { label: 'View Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Check attendance data' },
      { label: 'Check Marks', href: '/modules/marks', icon: Award, description: 'View grades' },
      { label: 'Assignments', href: '/modules/assignments', icon: FilePen, description: 'Review coursework' },
      { label: 'Fee Status', href: '/modules/fees', icon: IndianRupee, description: 'View dues and payments' },
    ],
    Parent: [
      { label: 'Child Progress', href: '/dashboard', icon: LayoutDashboard, description: 'View overview' },
      { label: 'Track Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Monitor attendance' },
      { label: 'Fee Status', href: '/modules/fees', icon: IndianRupee, description: 'Check dues' },
      { label: 'Alerts', href: '/modules/alerts', icon: Bell, description: 'View current alerts' },
    ],
  }
  return actions[role] || actions.Student
}

export function getMobileNavigation(role: string): NavItem[] {
  if (role === 'Super Admin') return ADMIN_NAV.slice(0, 4).concat(byHref(['/modules/profile']))
  if (role === 'Faculty') return byHref(['/dashboard', '/modules/my-classes', '/modules/attendance', '/modules/marks', '/modules/profile'])
  if (role === 'Student') return byHref(['/dashboard', '/modules/attendance', '/modules/assignments', '/modules/marks', '/modules/profile'])
  if (role === 'Parent') return byHref(['/dashboard', '/modules/attendance', '/modules/fees', '/modules/alerts', '/modules/profile'])
  return byHref(['/dashboard', '/modules/students', '/modules/attendance', '/modules/notices', '/modules/profile'])
}

export const GLOBAL_ELEMENTS = [
  'Command palette (Ctrl/Cmd+K)',
  'Live alerts',
  'User profile menu',
  'Role-aware navigation',
  'Role-based quick actions',
]
