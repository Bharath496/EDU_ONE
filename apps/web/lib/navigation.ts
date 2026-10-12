import type { NavItem, QuickAction, Module } from './types'
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
  Bookmark,
  HelpCircle,
  Search,
  Mail,
  Phone,
  MessageSquare,
  User,
} from 'lucide-react'

export const GLOBAL_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview and role summary' },
  { label: 'Students', href: '/modules/students', icon: GraduationCap, description: 'Admissions and student records' },
  { label: 'Faculty', href: '/modules/faculty', icon: UserCheck, description: 'Teacher records and assignments' },
  { label: 'Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Daily attendance capture' },
  { label: 'Exams', href: '/modules/exams', icon: ClipboardList, description: 'Schedules, results, and exam workflows' },
  { label: 'Assignments', href: '/modules/assignments', icon: FilePen, description: 'Submission, grading, and pending work' },
  { label: 'Library', href: '/modules/library', icon: Library, description: 'Books, issued items, and digital resources' },
  { label: 'Fees', href: '/modules/fees', icon: IndianRupee, description: 'Payments, dues, invoices, and receipts' },
  { label: 'Notices', href: '/modules/notices', icon: Megaphone, description: 'Announcements, chat, and alerts' },
  { label: 'Reports', href: '/modules/reports', icon: FileText, description: 'Exports and summaries' },
  { label: 'Student Intelligence', href: '/modules/student-intelligence', icon: BarChart3, description: 'Academic trends and explainable risk alerts' },
  { label: 'Settings', href: '/modules/settings', icon: Settings, description: 'Preferences and system settings' },
]

export const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Console', href: '/admin', icon: Shield, description: 'Platform controls and institutions' },
  { label: 'Colleges', href: '/admin/colleges', icon: Building2, description: 'Add, edit, remove colleges' },
  { label: 'Users', href: '/admin/users', icon: Users, description: 'Platform-wide user management' },
  { label: 'Billing', href: '/admin/billing', icon: CreditCard, description: 'Subscriptions and invoices' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Platform-wide metrics' },
  { label: 'System Settings', href: '/admin/settings', icon: Settings, description: 'Global configuration' },
]

export function getWorkspaceNavigation(role: string): NavItem[] {
  if (role === 'Super Admin') {
    return [...ADMIN_NAV, ...GLOBAL_NAV]
  }
  return GLOBAL_NAV
}

export function getQuickActions(role: string): QuickAction[] {
  const actions: Record<string, QuickAction[]> = {
    'Super Admin': [
      { label: 'Create College', href: '/admin/colleges/new', icon: Plus, description: 'Add a new institution tenant' },
      { label: 'Review Colleges', href: '/admin/colleges', icon: Building2, description: 'Manage branding and access' },
      { label: 'Open Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Return to overview' },
    ],
    'College Admin': [
      { label: 'Open Students', href: '/modules/students', icon: GraduationCap, description: 'Jump to student records' },
      { label: 'Mark Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Open attendance sheet' },
      { label: 'Create Notice', href: '/modules/notices/new', icon: Megaphone, description: 'Publish an announcement' },
      { label: 'Open Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Return to overview' },
    ],
    Faculty: [
      { label: 'My Classes', href: '/modules/my-classes', icon: BookOpen, description: 'View class schedule' },
      { label: 'Mark Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Open attendance sheet' },
      { label: 'Create Assignment', href: '/modules/assignments/new', icon: FilePen, description: 'Post new assignment' },
      { label: 'Enter Marks', href: '/modules/marks', icon: Award, description: 'Grade student work' },
    ],
    Student: [
      { label: 'View Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Check my attendance' },
      { label: 'Check Marks', href: '/modules/marks', icon: Award, description: 'View my grades' },
      { label: 'Submit Assignment', href: '/modules/assignments', icon: FilePen, description: 'Upload submission' },
      { label: 'Pay Fees', href: '/modules/fees', icon: IndianRupee, description: 'Clear dues' },
    ],
    Parent: [
      { label: 'Child Progress', href: '/dashboard', icon: LayoutDashboard, description: 'View overview' },
      { label: 'Track Attendance', href: '/modules/attendance', icon: CalendarCheck, description: 'Monitor attendance' },
      { label: 'Fee Status', href: '/modules/fees', icon: IndianRupee, description: 'Check dues' },
      { label: 'Alerts', href: '/modules/alerts', icon: Bell, description: 'View notifications' },
    ],
  }
  return actions[role] || actions['Student']
}

export const MOBILE_BOTTOM_NAV = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/modules/students', icon: GraduationCap },
  { label: 'Attendance', href: '/modules/attendance', icon: CalendarCheck },
  { label: 'Messages', href: '/modules/notices', icon: MessageSquare },
  { label: 'Profile', href: '/modules/settings', icon: User },
]

export const GLOBAL_ELEMENTS = [
  'Search bar (Ctrl+K)',
  'Notifications bell',
  'Messages',
  'User profile menu',
  'Institution switcher',
  'Quick actions (role-based)',
]