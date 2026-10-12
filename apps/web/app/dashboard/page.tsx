'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarCheck,
  CreditCard,
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
import { useEduStore } from '@/lib/edu-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  const students = useEduStore((state) => state.students)
  const attendanceSessions = useEduStore((state) => state.attendanceSessions)
  const assignments = useEduStore((state) => state.assignments)
  const notices = useEduStore((state) => state.notices)
  const fees = useEduStore((state) => state.fees)
  const exams = useEduStore((state) => state.exams)

  const tenants = usePlatformStore((state) => state.tenants)
  const platformUsers = usePlatformStore((state) => state.users)

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

  if (user.role === 'Super Admin') {
    const representedStudents = tenants.reduce((sum, item) => sum + item.students, 0)
    const activeTenants = tenants.filter((item) => item.status === 'active').length
    const activeUsers = platformUsers.filter((item) => item.status === 'active').length

    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Hero
          eyebrow="Platform workspace"
          title="EDU_ONE Super Admin"
          description="A truthful platform demo using fictional tenant and user records stored locally in your browser."
          actionHref="/admin"
          actionLabel="Open Admin Console"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Institutions" value={tenants.length} note={`${activeTenants} active`} icon={Building2} />
          <Metric label="Platform users" value={platformUsers.length} note={`${activeUsers} active`} icon={Users} />
          <Metric label="Students represented" value={representedStudents.toLocaleString('en-IN')} note="fictional demo metadata" icon={GraduationCap} />
          <Metric label="Deployment mode" value="GitHub" note="static local-first frontend" icon={ShieldCheck} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['/admin/colleges', Building2, 'Institutions', 'Add, activate and pause demo tenants'],
            ['/admin/users', Users, 'Platform Users', 'Manage fictional cross-tenant users'],
            ['/admin/analytics', BarChart3, 'Analytics', 'Calculated from current demo-store records'],
            ['/admin/billing', CreditCard, 'Plans', 'Illustrative plan values, clearly labelled demo data'],
          ].map(([href, Icon, title, description]) => {
            const ItemIcon = Icon as typeof Building2
            return (
              <Link key={String(href)} href={String(href)} className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm">
                <ItemIcon className="h-5 w-5 text-primary-600" />
                <p className="mt-3 font-semibold text-slate-950">{String(title)}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{String(description)}</p>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const matchedStudent =
    students.find((item) => item.name.toLowerCase() === user.name.toLowerCase()) ??
    students[0]

  if (user.role === 'Student' || user.role === 'Parent') {
    const ownFees = matchedStudent ? fees.filter((item) => item.studentId === matchedStudent.id) : []
    const pendingFees = ownFees
      .filter((item) => item.status !== 'paid')
      .reduce((sum, item) => sum + item.amount, 0)
    const upcomingExams = exams.filter((item) => item.status === 'upcoming').slice(0, 3)
    const openAssignments = assignments.filter((item) => item.status === 'published').slice(0, 3)
    const visibleNotices = notices
      .filter((item) => item.target !== 'Faculty')
      .slice(0, 3)

    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Hero
          eyebrow={user.role === 'Parent' ? 'Parent workspace' : 'Student workspace'}
          title={user.role === 'Parent' ? `${matchedStudent?.name ?? 'Student'} progress` : `Welcome, ${user.name.split(' ')[0]}`}
          description="A focused view of attendance, grades, coursework, fees and notices. Administrative controls stay out of student and parent hands, as civilization intended."
          actionHref="/modules/alerts"
          actionLabel="View Alerts"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Attendance" value={`${matchedStudent?.attendance ?? 0}%`} note="current overall" icon={CalendarCheck} />
          <Metric label="CGPA" value={(matchedStudent?.cgpa ?? 0).toFixed(1)} note="current record" icon={TrendingUp} />
          <Metric label="Open assignments" value={openAssignments.length} note="published coursework" icon={FilePen} />
          <Metric label="Pending fees" value={`₹${pendingFees.toLocaleString('en-IN')}`} note={ownFees.length ? 'current ledger' : 'no fee records'} icon={IndianRupee} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Upcoming exams</CardTitle><CardDescription>Scheduled assessments in the demo workspace.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{exam.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{exam.course} • {exam.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Coursework</CardTitle><CardDescription>Published assignments awaiting completion.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {openAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{assignment.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{assignment.course} • due {assignment.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Latest notices</CardTitle><CardDescription>Announcements relevant to students and families.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {visibleNotices.map((notice) => (
                <div key={notice.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{notice.title}</p>
                    <Badge variant={notice.priority === 'urgent' ? 'danger' : notice.priority === 'high' ? 'warning' : 'secondary'} size="sm">{notice.priority}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{notice.author}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length)
    : 0
  const atRisk = students.filter((item) => item.attendance < 75 || item.cgpa < 6).length
  const collected = fees.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const publishedAssignments = assignments.filter((item) => item.status === 'published').length
  const upcomingExamCount = exams.filter((item) => item.status === 'upcoming').length

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <Hero
        eyebrow={user.role === 'Faculty' ? 'Faculty workspace' : 'College administration'}
        title={`Welcome, ${user.name.split(' ')[0]}`}
        description={
          user.role === 'Faculty'
            ? 'Teaching workflows, attendance, assessments and student progress share one local-first workspace.'
            : 'Institution operations are connected through one persistent demo data layer instead of disconnected mock screens.'
        }
        actionHref={user.role === 'Faculty' ? '/modules/my-classes' : '/modules/students'}
        actionLabel={user.role === 'Faculty' ? 'Open My Classes' : 'Manage Students'}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Students" value={students.length} note={`${atRisk} need attention`} icon={GraduationCap} />
        <Metric label="Average attendance" value={`${avgAttendance}%`} note={`${attendanceSessions.length} saved sessions`} icon={CalendarCheck} />
        <Metric label="Assignments" value={publishedAssignments} note="currently published" icon={FilePen} />
        <Metric
          label={user.role === 'Faculty' ? 'Upcoming exams' : 'Fees collected'}
          value={user.role === 'Faculty' ? upcomingExamCount : `₹${collected.toLocaleString('en-IN')}`}
          note={user.role === 'Faculty' ? 'scheduled assessments' : 'demo ledger'}
          icon={user.role === 'Faculty' ? BookOpen : IndianRupee}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Students needing attention</CardTitle>
            <CardDescription>Explainable flags from attendance and CGPA thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.filter((item) => item.attendance < 75 || item.cgpa < 6).slice(0, 5).map((student) => (
              <div key={student.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-700"><AlertTriangle className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.regNo} • {student.department}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{student.attendance}% attendance</p>
                  <p>{student.cgpa.toFixed(1)} CGPA</p>
                </div>
              </div>
            ))}
            <Link href="/modules/student-intelligence" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
              Open Student Intelligence <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current priorities</CardTitle><CardDescription>Live signals from connected modules.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Priority icon={FilePen} label="Published assignments" value={publishedAssignments} href="/modules/assignments" />
            <Priority icon={BookOpen} label="Upcoming exams" value={upcomingExamCount} href="/modules/exams" />
            <Priority icon={Megaphone} label="High-priority notices" value={notices.filter((item) => item.priority === 'high' || item.priority === 'urgent').length} href="/modules/notices" />
            <Priority icon={Sparkles} label="Students at risk" value={atRisk} href="/modules/student-intelligence" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Hero({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  eyebrow: string
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-primary-900 p-6 text-white lg:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-indigo-100 lg:text-base">{description}</p>
      <Link href={actionHref}>
        <Button size="sm" className="mt-5 gap-2 bg-white text-slate-950 hover:bg-slate-100">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  )
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string
  value: string | number
  note: string
  icon: typeof UserCheck
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><Icon className="h-6 w-6" /></div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-950">{value}</p>
          <p className="text-xs text-slate-400">{note}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Priority({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof UserCheck
  label: string
  value: number
  href: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-700"><Icon className="h-4 w-4" /></div>
      <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{label}</span>
      <span className="text-lg font-bold text-slate-950">{value}</span>
    </Link>
  )
}
