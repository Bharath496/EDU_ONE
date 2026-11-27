'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

type Course = { id: string; code: string; title: string }
type Student = { id: string; registration_number: string; name: string }

export default function InstitutionalAttendancePage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courseId, setCourseId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [attendanceSaved, setAttendanceSaved] = useState(false)
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10))
  const [period, setPeriod] = useState('1')
  const [topic, setTopic] = useState('')
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getInstitutionalCourses()
      setCourses(Array.isArray(response) ? response : response.items || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load assigned courses.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Faculty', 'College Admin', 'HOD', 'Class Advisor'].includes(user.role)) { router.replace('/institutional'); return }
    void loadCourses()
  }, [isAuthenticated, isLoading, loadCourses, router, token, user])

  const selectCourse = async (nextId: string) => {
    setCourseId(nextId)
    setStudents([])
    setStatuses({})
    setSessionId('')
    setError('')
    if (!nextId) return
    try {
      const response = await api.getCourseStudents(nextId)
      setStudents(response || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load this course roster.')
    }
  }

  const createSession = async () => {
    if (!courseId) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await api.createAttendanceSession({
        course_id: courseId,
        session_date: sessionDate,
        period: Number(period),
        topic: topic || undefined,
      })
      setSessionId(response.id)
      setAttendanceSaved(false)
      setSuccess('Attendance session created. Mark each student and save.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create the attendance session.')
    } finally {
      setSaving(false)
    }
  }

  const saveAttendance = async () => {
    if (!sessionId || !students.length) return
    if (students.some(student => !statuses[student.id])) {
      setError('Select an attendance status for every student before saving.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.markInstitutionalAttendance(sessionId, students.map(student => ({
        student_profile_id: student.id,
        status: statuses[student.id] as 'present' | 'absent' | 'late' | 'excused',
      })))
      setAttendanceSaved(true)
      setSuccess('Attendance records saved. Lock the session to prevent further changes.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Attendance could not be saved. The open session remains available for retry.')
    } finally {
      setSaving(false)
    }
  }

  const lockSession = async () => {
    if (!sessionId || !attendanceSaved) return
    setSaving(true)
    setError('')
    try {
      await api.lockAttendanceSession(sessionId)
      setSuccess('Attendance session is locked.')
      setSessionId('')
      setStatuses({})
      setAttendanceSaved(false)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not lock the session. Retry the lock action.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading attendance workspace...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Attendance marking</h1><p className="text-sm text-slate-500">Only students enrolled in the selected course are listed.</p></div>
      </header>
      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm">Course<select value={courseId} onChange={e => void selectCourse(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose a course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}</select></label>
          <label className="text-sm">Session date<input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="text-sm">Period<input type="number" min="1" max="16" value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="text-sm">Topic (optional)<input value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          {!sessionId && <div className="sm:col-span-2"><Button onClick={() => void createSession()} disabled={!courseId || saving}>Create attendance session</Button></div>}
        </CardContent></Card>

        {sessionId && <Card><CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-950"><ClipboardCheck className="h-4 w-4" /> Mark attendance · {students.length} students</div>
          {!attendanceSaved ? <>
            <div className="space-y-3">{students.map(student => <div key={student.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"><div><p className="font-medium text-slate-800">{student.name}</p><p className="text-xs text-slate-500">{student.registration_number}</p></div><select value={statuses[student.id] || ''} onChange={e => setStatuses(previous => ({ ...previous, [student.id]: e.target.value }))} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">Select status</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select></div>)}</div>
            <div className="mt-5 flex justify-end"><Button onClick={() => void saveAttendance()} disabled={saving || !students.length}>{saving ? 'Saving...' : 'Save attendance records'}</Button></div>
          </> : <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-600">All attendance records are saved. Lock the session when ready.</p><Button onClick={() => void lockSession()} disabled={saving}>{saving ? 'Locking...' : 'Lock session'}</Button></div>}
        </CardContent></Card>}
        {courseId && !sessionId && students.length === 0 && !error && <p className="text-sm text-slate-500">No active students are enrolled in this course.</p>}
      </div>
    </main>
  )
}
