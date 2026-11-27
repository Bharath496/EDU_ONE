'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CalendarCheck, ClipboardList, GraduationCap, IndianRupee, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

type Data = {
  profile?: any; attendance?: any; students?: any[]; courses?: any[]
  exams?: any[]; assignments?: any[]; fees?: any[]; results?: any[]; timetable?: any[]; calendar?: any[]; opportunities?: any[]; applications?: any[]
}
const items = (value: any) => Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : []

export default function InstitutionalWorkspacePage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading, clearAuth } = useAuthStore()
  const [data, setData] = useState<Data>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user || !token || token === 'demo-session') return
    setLoading(true)
    setError('')
    const jobs: Promise<void>[] = []
    const add = (job: Promise<any>, key: keyof Data) => jobs.push(job.then(value => {
      setData(previous => ({ ...previous, [key]: key === 'profile' || key === 'attendance' ? value : items(value) }))
    }))
    if (user.role === 'Student') {
      add(api.getMyStudentProfile(), 'profile')
      add(api.getMyAttendance(), 'attendance')
      add(api.getMyResults(), 'results')
      add(api.getInstitutionalCourses(), 'courses')
      add(api.getInstitutionalExams(), 'exams')
      add(api.getInstitutionalAssignments(), 'assignments')
      add(api.getMyTimetable(), 'timetable')
      add(api.getInstitutionalCalendar(), 'calendar')
      add(api.getPlacementOpportunities(), 'opportunities')
      add(api.getMyPlacementApplications(), 'applications')
      add(api.getInstitutionalFees(), 'fees')
    } else {
      if (['College Admin', 'Principal', 'Vice Principal', 'HOD', 'Class Advisor', 'Admissions', 'Parent'].includes(user.role)) add(api.getInstitutionalStudents(), 'students')
      if (['College Admin', 'Principal', 'Vice Principal', 'HOD', 'Class Advisor', 'Faculty', 'Student', 'Parent', 'Exam Cell'].includes(user.role)) {
        add(api.getInstitutionalCourses(), 'courses')
        add(api.getInstitutionalExams(), 'exams')
      }
      if (['College Admin', 'Principal', 'Vice Principal', 'HOD', 'Class Advisor', 'Faculty', 'Student', 'Parent'].includes(user.role)) add(api.getInstitutionalAssignments(), 'assignments')
      if (['College Admin', 'Principal', 'Accounts', 'Parent'].includes(user.role)) add(api.getInstitutionalFees(), 'fees')
      if (user.role === 'Faculty') add(api.getFacultyTimetable(), 'timetable')
      if (user.role === 'Placement Officer') add(api.getPlacementOpportunities(), 'opportunities')
      add(api.getInstitutionalCalendar(), 'calendar')
    }
    const settled = await Promise.allSettled(jobs)
    const failed = settled.filter(result => result.status === 'rejected')
    if (failed.length === settled.length && settled.length) {
      const reason = (failed[0] as PromiseRejectedResult).reason
      setError(reason?.response?.data?.detail || 'Unable to load institutional data. Check the API and database configuration.')
    } else if (failed.length) {
      setError('Some sections are unavailable for this role or are not configured yet.')
    }
    setLoading(false)
  }, [token, user])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) { router.replace('/'); return }
    if (token === 'demo-session') { router.replace('/dashboard'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const applyToOpportunity = async (opportunityId: string) => {
    setApplyingId(opportunityId)
    setError('')
    setSuccess('')
    try {
      await api.applyToPlacement(opportunityId, 'Application submitted through the institutional workspace.')
      setSuccess('Your placement application was submitted.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to submit this application.')
    } finally {
      setApplyingId(null)
    }
  }

  const signOut = async () => {
    try { await api.logout() } catch { /* Clear local state if the API is offline. */ }
    clearAuth()
    router.replace('/')
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading institutional workspace...</main>

  const cards = [
    { label: 'Students', count: data.profile ? 1 : data.students?.length, icon: GraduationCap },
    { label: 'Courses', count: data.courses?.length, icon: BookOpen },
    { label: 'Exams', count: data.exams?.length, icon: ClipboardList },
    { label: 'Assignments', count: data.assignments?.length, icon: CalendarCheck },
    { label: 'Fee invoices', count: data.fees?.length, icon: IndianRupee },
  ].filter(item => item.count !== undefined)

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Institutional workspace</p><h1 className="mt-1 text-xl font-bold text-slate-950">{user?.collegeName || 'EDU_ONE'}</h1><p className="mt-1 text-sm text-slate-500">{user?.name} · {user?.role}</p></div>
          <div className="flex items-center gap-2">
            {user?.role === 'College Admin' && <Link href="/institutional/users" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Manage users</Link>}
            {['Placement Officer', 'College Admin'].includes(user?.role || '') && <Link href="/institutional/placements" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Manage placements</Link>}
            {['Accounts', 'College Admin'].includes(user?.role || '') && <Link href="/institutional/finance" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Finance</Link>}
            {['Student', 'Librarian', 'College Admin'].includes(user?.role || '') && <Link href="/institutional/library" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Library</Link>}
            {['Student', 'Parent', 'Support Staff', 'College Admin', 'Principal', 'Vice Principal'].includes(user?.role || '') && <Link href="/institutional/support" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Support</Link>}
            <Link href="/institutional/announcements" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Announcements</Link>
            {['Student', 'Faculty', 'Exam Cell', 'College Admin', 'HOD', 'Class Advisor'].includes(user?.role || '') && <Link href="/institutional/academics" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Academics</Link>}
            {['Faculty', 'College Admin', 'HOD', 'Class Advisor'].includes(user?.role || '') && <Link href="/institutional/attendance" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Mark attendance</Link>}
            <Button variant="outline" onClick={signOut} className="gap-2"><LogOut className="h-4 w-4" /> Sign out</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        {error && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
        {success && <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}
        <h2 className="text-2xl font-bold text-slate-950">Live institutional records</h2>
        <p className="mt-1 text-sm text-slate-500">This page reads from the database-backed API. It never substitutes demo records when a live module is unavailable.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(item => <Card key={item.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><item.icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{item.count}</p></div></CardContent></Card>)}
        </div>
        {data.profile && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">My student profile</h3><p className="mt-2 text-sm text-slate-600">{data.profile.registration_number} · {data.profile.programme || 'Programme not set'} · Semester {data.profile.semester ?? '—'}</p></CardContent></Card>}
        {data.attendance && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">Attendance</h3><p className="mt-2 text-sm text-slate-600">{data.attendance.attendance_percentage === null ? 'No attendance records yet' : `${data.attendance.attendance_percentage}% attendance`} · {data.attendance.total_sessions} sessions</p></CardContent></Card>}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {data.students && <Card><CardContent className="p-5"><div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> Student records</div><div className="mt-4 space-y-3">{data.students.slice(0, 8).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.name}</span><span className="text-slate-500">{row.registration_number}</span></div>)}</div></CardContent></Card>}
          {data.courses && <Card><CardContent className="p-5"><div className="font-semibold">Courses</div><div className="mt-4 space-y-3">{data.courses.slice(0, 8).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.title}</span><span className="text-slate-500">{row.code}</span></div>)}</div></CardContent></Card>}
          {data.exams && <Card><CardContent className="p-5"><div className="font-semibold">Examinations</div><div className="mt-4 space-y-3">{data.exams.slice(0, 8).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.title}</span><span className="text-slate-500">{row.status}</span></div>)}</div></CardContent></Card>}
          {data.assignments && <Card><CardContent className="p-5"><div className="font-semibold">Assignments</div><div className="mt-4 space-y-3">{data.assignments.slice(0, 8).map(row => <div key={row.id} className="border-b border-slate-100 pb-2 text-sm"><p>{row.title}</p><p className="mt-1 text-slate-500">Due {new Date(row.due_at).toLocaleString()}</p></div>)}</div></CardContent></Card>}
          {data.fees && <Card><CardContent className="p-5"><div className="flex items-center gap-2 font-semibold"><IndianRupee className="h-4 w-4" /> Fee invoices</div><div className="mt-4 space-y-3">{data.fees.slice(0, 8).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.fee_type}</span><span className="text-slate-500">₹{row.outstanding_amount} · {row.status}</span></div>)}</div></CardContent></Card>}
        </div>
        {data.results && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">Published results</h3><div className="mt-3 space-y-2">{data.results.map(row => <div key={row.id} className="flex justify-between text-sm"><span>{row.exam_title}</span><span>{row.marks_obtained}/{row.max_marks} · {row.grade || '—'}</span></div>)}</div></CardContent></Card>}
        {data.timetable && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">Timetable</h3><div className="mt-3 space-y-2">{data.timetable.slice(0, 10).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.course_title} · {row.room || 'Room TBA'}</span><span className="text-slate-500">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][row.weekday]} {row.start_time}–{row.end_time}</span></div>)}{data.timetable.length === 0 && <p className="text-sm text-slate-500">No timetable slots are active today.</p>}</div></CardContent></Card>}
        {data.calendar && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">Academic calendar</h3><div className="mt-3 space-y-2">{data.calendar.slice(0, 10).map(row => <div key={row.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span>{row.title} · {row.event_type}</span><span className="text-slate-500">{new Date(row.start_at).toLocaleDateString()}</span></div>)}{data.calendar.length === 0 && <p className="text-sm text-slate-500">No upcoming calendar events.</p>}</div></CardContent></Card>}
        {data.opportunities && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">Placement opportunities</h3><div className="mt-3 space-y-3">{data.opportunities.slice(0, 8).map(row => <div key={row.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm"><div><div className="flex flex-wrap gap-2"><span className="font-medium">{row.title} · {row.company}</span><span className="text-slate-500">{row.employment_type}</span></div><p className="mt-1 text-slate-500">Apply by {new Date(row.application_deadline).toLocaleDateString()}</p><p className="mt-1 text-slate-600">{row.eligibility_text}</p></div>{user?.role === 'Student' && <Button size="sm" onClick={() => void applyToOpportunity(row.id)} disabled={applyingId === row.id}>{applyingId === row.id ? 'Applying...' : 'Apply'}</Button>}</div>)}{data.opportunities.length === 0 && <p className="text-sm text-slate-500">No active opportunities.</p>}</div></CardContent></Card>}
        {data.applications && <Card className="mt-6"><CardContent className="p-5"><h3 className="font-semibold">My placement applications</h3><div className="mt-3 space-y-2">{data.applications.map(row => <div key={row.id} className="flex justify-between text-sm"><span>{row.company} · {row.opportunity_title}</span><span className="text-slate-500">{row.status}</span></div>)}{data.applications.length === 0 && <p className="text-sm text-slate-500">No applications submitted yet.</p>}</div></CardContent></Card>}
        <div className="mt-8 flex justify-end"><Button variant="outline" onClick={() => void load()}>Refresh records</Button></div>
      </div>
    </main>
  )
}
