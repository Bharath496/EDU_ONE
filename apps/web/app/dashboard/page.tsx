'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { getQuickActions } from '@/lib/navigation'
import { CommandPalette } from '@/components/ui/CommandPalette'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  FilePen,
  IndianRupee,
  Megaphone,
  Settings,
  Building2,
  Shield,
  CreditCard,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  Award,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const ROLE_ICONS = {
  'Super Admin': Shield,
  'College Admin': Building2,
  Faculty: UserCheck,
  Student: GraduationCap,
  Parent: Users,
}

const STAT_CARDS = {
  'Super Admin': [
    { label: 'Total Colleges', value: '156', change: '+12%', trend: 'up', icon: Building2, color: 'blue' },
    { label: 'Active Users', value: '48.2K', change: '+8.5%', trend: 'up', icon: Users, color: 'green' },
    { label: 'Demo Revenue', value: '₹24L', change: '+15%', trend: 'up', icon: CreditCard, color: 'purple' },
    { label: 'Open Requests', value: '23', change: '-5', trend: 'down', icon: HelpCircle, color: 'red' },
  ],
  'College Admin': [
    { label: 'Total Students', value: '3,240', change: '+45', trend: 'up', icon: GraduationCap, color: 'blue' },
    { label: 'Active Faculty', value: '186', change: '+3', trend: 'up', icon: UserCheck, color: 'green' },
    { label: 'Attendance Rate', value: '94.2%', change: '+1.2%', trend: 'up', icon: CheckCircle, color: 'purple' },
    { label: 'Fee Collection', value: '87%', change: '+5%', trend: 'up', icon: IndianRupee, color: 'amber' },
  ],
  Faculty: [
    { label: 'My Classes', value: '6', change: '0', trend: 'neutral', icon: BookOpen, color: 'blue' },
    { label: 'Total Students', value: '234', change: '+12', trend: 'up', icon: GraduationCap, color: 'green' },
    { label: 'Attendance Avg', value: '92%', change: '+2%', trend: 'up', icon: CheckCircle, color: 'purple' },
    { label: 'Pending Grading', value: '18', change: '-5', trend: 'down', icon: Award, color: 'red' },
  ],
  Student: [
    { label: 'Attendance', value: '94%', change: '+2%', trend: 'up', icon: CheckCircle, color: 'green' },
    { label: 'Current GPA', value: '8.7', change: '+0.2', trend: 'up', icon: Award, color: 'blue' },
    { label: 'Assignments Due', value: '3', change: '-2', trend: 'down', icon: FilePen, color: 'amber' },
    { label: 'Fee Balance', value: '₹12,000', change: 'Due in 5 days', trend: 'neutral', icon: IndianRupee, color: 'red' },
  ],
  Parent: [
    { label: "Child's Attendance", value: '96%', change: '+1%', trend: 'up', icon: CheckCircle, color: 'green' },
    { label: "Child's GPA", value: '8.9', change: '+0.1', trend: 'up', icon: Award, color: 'blue' },
    { label: 'Fee Due', value: '₹8,000', change: 'Due in 10 days', trend: 'neutral', icon: IndianRupee, color: 'amber' },
    { label: 'Upcoming Events', value: '3', change: 'This month', trend: 'neutral', icon: CalendarCheck, color: 'purple' },
  ],
}

const RECENT_ACTIVITY = {
  'Super Admin': [
    { type: 'college', title: 'New college onboarded', desc: 'St. Xavier College, Mumbai', time: '2 min ago', icon: Building2, color: 'blue' },
    { type: 'user', title: 'New admin registered', desc: 'Dr. Priya Sharma - Delhi', time: '15 min ago', icon: UserCheck, color: 'green' },
    { type: 'billing', title: 'Payment received', desc: '$12,500 from PSG Tech', time: '1 hour ago', icon: CreditCard, color: 'purple' },
    { type: 'support', title: 'Support ticket resolved', desc: 'Attendance sync issue', time: '3 hours ago', icon: HelpCircle, color: 'amber' },
  ],
  'College Admin': [
    { type: 'admission', title: 'New student admitted', desc: 'Arjun Kumar - CSE 1st Year', time: '10 min ago', icon: GraduationCap, color: 'blue' },
    { type: 'faculty', title: 'Faculty joined', desc: 'Prof. Meera Patel - ECE Dept', time: '2 hours ago', icon: UserCheck, color: 'green' },
    { type: 'fee', title: 'Fee payment received', desc: 'Batch 2024 - Semester 2', time: '4 hours ago', icon: IndianRupee, color: 'purple' },
    { type: 'notice', title: 'Notice published', desc: 'Exam schedule for Sem 2', time: '6 hours ago', icon: Megaphone, color: 'amber' },
  ],
  Faculty: [
    { type: 'assignment', title: 'Assignment submitted', desc: 'Data Structures - 23 submissions', time: '30 min ago', icon: FilePen, color: 'blue' },
    { type: 'attendance', title: 'Attendance marked', desc: 'CSE-201 - 92% present', time: '1 hour ago', icon: CalendarCheck, color: 'green' },
    { type: 'grading', title: 'Grades published', desc: 'Mid-term Exam - CSE-301', time: '3 hours ago', icon: Award, color: 'purple' },
    { type: 'class', title: 'Class scheduled', desc: 'Operating Systems - Tomorrow 10AM', time: '5 hours ago', icon: BookOpen, color: 'amber' },
  ],
  Student: [
    { type: 'grade', title: 'Grade updated', desc: 'Data Structures - A grade', time: '1 hour ago', icon: Award, color: 'green' },
    { type: 'assignment', title: 'Assignment due', desc: 'Operating Systems - Due tomorrow', time: '3 hours ago', icon: FilePen, color: 'amber' },
    { type: 'attendance', title: 'Attendance marked', desc: 'Database Systems - Present', time: '5 hours ago', icon: CalendarCheck, color: 'blue' },
    { type: 'notice', title: 'New announcement', desc: 'Cultural fest registration open', time: '1 day ago', icon: Megaphone, color: 'purple' },
  ],
  Parent: [
    { type: 'grade', title: 'Grade update', desc: 'Mathematics - 92/100', time: '2 hours ago', icon: Award, color: 'green' },
    { type: 'attendance', title: 'Absence alert', desc: 'Physics class - 1 period missed', time: '4 hours ago', icon: AlertCircle, color: 'red' },
    { type: 'fee', title: 'Fee reminder', desc: 'Semester 3 fees due in 7 days', time: '1 day ago', icon: IndianRupee, color: 'amber' },
    { type: 'event', title: 'PTM scheduled', desc: 'Parent-Teacher Meeting - Next Friday', time: '2 days ago', icon: CalendarCheck, color: 'blue' },
  ],
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/')
    return null
  }

  const roleStats = STAT_CARDS[user.role as keyof typeof STAT_CARDS] || STAT_CARDS['Student']
  const recentActivities = RECENT_ACTIVITY[user.role as keyof typeof RECENT_ACTIVITY] || RECENT_ACTIVITY['Student']
  const quickActions = getQuickActions(user.role)
  const RoleIcon = ROLE_ICONS[user.role as keyof typeof ROLE_ICONS] || GraduationCap

  const getStatColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      red: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">EduOne Platform</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
              Good morning, {user.name.split(' ')[0]}
              <RoleIcon className="w-6 h-6 text-primary-600" />
              <Badge variant="primary" size="sm">{user.role}</Badge>
            </h1>
            <p className="text-slate-600 mt-1">{user.collegeName}</p>
          </div>
          <div className="flex items-center gap-3">
            <CommandPalette
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="w-4 h-4" />
                  <span>Search (⌘K)</span>
                </Button>
              }
              isOpen={false}
              onClose={() => {}}
            >
              <CommandPalette.Section label="Quick Actions">
                <CommandPalette.Item href="/dashboard" label="Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} />
                <CommandPalette.Item href="/modules/students" label="Students" icon={<GraduationCap className="w-4 h-4" />} />
                <CommandPalette.Item href="/modules/faculty" label="Faculty" icon={<UserCheck className="w-4 h-4" />} />
                <CommandPalette.Item href="/modules/attendance" label="Attendance" icon={<CalendarCheck className="w-4 h-4" />} />
                <CommandPalette.Item href="/modules/fees" label="Fees" icon={<IndianRupee className="w-4 h-4" />} />
              </CommandPalette.Section>
            </CommandPalette>
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Quick Action</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {roleStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-soft transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {stat.trend === 'neutral' && <Activity className="w-4 h-4 text-slate-400" />}
                    <span className={cn('text-sm font-medium', stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-500')}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={cn('p-3 rounded-2xl', getStatColor(stat.color))}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common tasks for your role</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <p className="font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest updates in your institution</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', getStatColor(activity.color))}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-500 truncate">{activity.desc}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">My Schedule</CardTitle>
                <CardDescription>Today's classes and events</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { time: '09:00 AM', subject: 'Data Structures', room: 'Lab 3', type: 'class', status: 'upcoming' },
                  { time: '11:00 AM', subject: 'Database Systems', room: 'Room 204', type: 'class', status: 'current' },
                  { time: '02:00 PM', subject: 'Operating Systems', room: 'Room 101', type: 'lab', status: 'upcoming' },
                  { time: '04:00 PM', subject: 'Project Review', room: 'Conference Room', type: 'meeting', status: 'upcoming' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="w-14 text-right text-sm font-medium text-slate-600">{item.time}</div>
                    <div className={cn('w-2 h-full rounded-l-2xl', item.status === 'current' ? 'bg-primary-500' : 'bg-slate-200')} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.subject}</p>
                      <p className="text-sm text-slate-500">{item.room} • {item.type}</p>
                    </div>
                    {item.status === 'current' && (
                      <Badge variant="primary" size="sm">Live</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
      )
}