'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  FilePen,
  GraduationCap,
  IndianRupee,
  Megaphone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { getQuickActions } from '@/lib/navigation'
import { useEduStore } from '@/lib/edu-store'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  const students = useEduStore((state) => state.students)
  const attendanceSessions = useEduStore((state) => state.attendanceSessions)
  const assignments = useEduStore((state) => state.assignments)
  const notices = useEduStore((state) => state.notices)
  const fees = useEduStore((state) => state.fees)
  const activity = useEduStore((state) => state.activity)

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white">E</div>
          <p className="mt-3 text-sm text-slate-500">Loading EDU_ONE workspace...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    router.push('/')
    return null
  }

  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
    : 0
  const atRisk = students.filter((student) => student.attendance < 75 || student.cgpa < 6).length
  const collected = fees.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const totalFees = fees.reduce((sum, item) => sum + item.amount, 0)
  const feeRate = totalFees ? Math.round((collected / totalFees) * 100) : 0
  const dueAssignments = assignments.filter((item) => item.status === 'published').length
  const urgentNotices = notices.filter((item) => item.priority === 'urgent' || item.priority === 'high').length
  const quickActions = getQuickActions(user.role)

  const metrics = [
    {
      label: 'Students',
      value: students.length,
      note: `${students.filter((item) => item.status === 'active').length} active`,
      icon: GraduationCap,
      cls: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Attendance',
      value: `${avgAttendance}%`,
      note: `${attendanceSessions.length} saved sessions`,
      icon: CalendarCheck,
      cls: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Fee collection',
      value: `${feeRate}%`,
      note: `₹${collected.toLocaleString('en-IN')} collected`,
      icon: IndianRupee,
      cls: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Needs attention',
      value: atRisk,
      note: 'attendance or CGPA risk',
      icon: UserCheck,
      cls: 'bg-amber-50 text-amber-700',
    },
  ]

  const departmentRows = Array.from(new Set(students.map((item) => item.department)))
    .map((department) => {
      const group = students.filter((item) => item.department === department)
      return {
        department,
        students: group.length,
        attendance: Math.round(group.reduce((sum, item) => sum + item.attendance, 0) / Math.max(group.length, 1)),
        cgpa: (group.reduce((sum, item) => sum + item.cgpa, 0) / Math.max(group.length, 1)).toFixed(1),
      }
    })
    .sort((a, b) => b.students - a.students)

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-primary-900 p-6 text-white lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">{user.role}</Badge>
              <span className="text-xs font-medium text-indigo-200">Local-first portfolio workspace</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 lg:text-base">
              EDU_ONE now behaves like one connected college workspace. Student records, attendance, fees,
              assignments and notices share the same persisted demo data instead of living as unrelated mock screens.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/modules/students"><Button size="sm" className="gap-2 bg-white text-slate-950 hover:bg-slate-100">Open students <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/modules/student-intelligence"><Button variant="outline" size="sm" className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"><Sparkles className="h-4 w-4" />Student intelligence</Button></Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-indigo-200">Workspace health</p>
                <p className="mt-1 text-2xl font-bold">Ready</p>
              </div>
              <ShieldCheck className="h-9 w-9 text-emerald-300" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">{students.length}</p><p className="text-indigo-200">students</p></div>
              <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">{assignments.length}</p><p className="text-indigo-200">assignments</p></div>
              <div className="rounded-xl bg-white/10 p-2"><p className="text-lg font-bold">{notices.length}</p><p className="text-indigo-200">notices</p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${metric.cls}`}><metric.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">{metric.label}</p>
                <p className="text-2xl font-bold text-slate-950">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.note}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Department snapshot</CardTitle>
            <CardDescription>Live summary from the same student store used across the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="py-3 font-medium">Department</th>
                    <th className="py-3 text-center font-medium">Students</th>
                    <th className="py-3 text-center font-medium">Attendance</th>
                    <th className="py-3 text-center font-medium">CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentRows.map((row) => (
                    <tr key={row.department} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-semibold text-slate-900">{row.department}</td>
                      <td className="py-3 text-center text-slate-600">{row.students}</td>
                      <td className="py-3 text-center">
                        <span className={row.attendance >= 75 ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{row.attendance}%</span>
                      </td>
                      <td className="py-3 text-center font-semibold text-slate-700">{row.cgpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current priorities</CardTitle>
            <CardDescription>Useful signals rather than decorative dashboard numbers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: FilePen, label: 'Published assignments', value: dueAssignments, href: '/modules/assignments', cls: 'bg-blue-50 text-blue-700' },
              { icon: Megaphone, label: 'High-priority notices', value: urgentNotices, href: '/modules/notices', cls: 'bg-amber-50 text-amber-700' },
              { icon: Users, label: 'Students needing attention', value: atRisk, href: '/modules/student-intelligence', cls: 'bg-red-50 text-red-700' },
              { icon: CheckCircle2, label: 'Saved attendance sessions', value: attendanceSessions.length, href: '/modules/attendance', cls: 'bg-emerald-50 text-emerald-700' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                <div className={`rounded-xl p-2.5 ${item.cls}`}><item.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                </div>
                <span className="text-lg font-bold text-slate-950">{item.value}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Role-aware navigation for {user.role}.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.slice(0, 6).map((action) => (
              <Link key={action.href} href={action.href} className="rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  <action.icon className="h-4 w-4" />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity log</CardTitle>
            <CardDescription>Recent actions recorded by the browser workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.slice(0, 7).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="mt-0.5 rounded-lg bg-white p-2 text-primary-600 shadow-sm"><Activity className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                  <p className="truncate text-xs text-slate-500">{entry.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400">{new Date(entry.at).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-medium text-slate-800">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          Upgrade status
        </div>
        <p className="mt-1">
          Core portfolio workflows are now connected through a persistent local data layer. This keeps the demo free while making interactions real instead of static screenshots wearing buttons.
        </p>
      </div>
    </div>
  )
}
