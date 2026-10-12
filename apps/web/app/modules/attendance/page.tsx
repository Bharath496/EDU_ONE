'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Download,
  Save,
  Search,
  UserX,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { COURSES, type AttendanceStatus } from '@/lib/demo-data'
import { useEduStore } from '@/lib/edu-store'

const STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string; badge: 'success' | 'danger' | 'warning' | 'primary' }> = [
  { value: 'present', label: 'Present', badge: 'success' },
  { value: 'absent', label: 'Absent', badge: 'danger' },
  { value: 'late', label: 'Late', badge: 'warning' },
  { value: 'excused', label: 'Excused', badge: 'primary' },
]

function downloadAttendance(course: string, date: string, rows: Array<{ regNo: string; name: string; status: AttendanceStatus }>) {
  const csv = [
    ['Course', 'Date', 'Register No', 'Student', 'Status'],
    ...rows.map((row) => [course, date, row.regNo, row.name, row.status]),
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `attendance-${date}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function AttendancePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const sessions = useEduStore((state) => state.attendanceSessions)
  const saveAttendance = useEduStore((state) => state.saveAttendance)

  const [course, setCourse] = useState(COURSES[0])
  const [date, setDate] = useState('2026-10-12')
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})
  const [saved, setSaved] = useState(false)
  const canManage = user?.role === 'College Admin' || user?.role === 'Faculty'

  const scopedStudents = useMemo(() => {
    if (canManage) return students
    const matched =
      students.find((student) => student.name.toLowerCase() === user?.name.toLowerCase()) ??
      students[0]
    return matched ? [matched] : []
  }, [canManage, students, user?.name])

  const selectedSession = useMemo(
    () => sessions.find((item) => item.course === course && item.date === date),
    [course, date, sessions]
  )

  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {}
    scopedStudents.forEach((student) => {
      next[student.id] = selectedSession?.records[student.id] ?? 'present'
    })
    setRecords(next)
    setSaved(false)
  }, [scopedStudents, selectedSession])

  const filteredStudents = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return scopedStudents
    return scopedStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(needle) ||
        student.regNo.toLowerCase().includes(needle)
    )
  }, [scopedStudents, search])

  const counts = STATUS_OPTIONS.reduce<Record<AttendanceStatus, number>>(
    (acc, option) => {
      acc[option.value] = scopedStudents.filter((student) => records[student.id] === option.value).length
      return acc
    },
    { present: 0, absent: 0, late: 0, excused: 0 }
  )

  const attendancePercent = scopedStudents.length
    ? Math.round(((counts.present + counts.excused + counts.late * 0.8) / scopedStudents.length) * 100)
    : 0

  const setAll = (status: AttendanceStatus) => {
    if (!canManage) return
    const next = { ...records }
    filteredStudents.forEach((student) => {
      next[student.id] = status
    })
    setRecords(next)
    setSaved(false)
  }

  const persist = () => {
    if (!canManage) return
    saveAttendance(course, date, records)
    setSaved(true)
  }

  const exportRows = scopedStudents.map((student) => ({
    regNo: student.regNo,
    name: student.name,
    status: records[student.id] ?? 'present',
  }))

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Attendance Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManage
              ? 'Mark a session, save it locally, and student attendance percentages update automatically.'
              : 'Read-only attendance history for the current student profile.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadAttendance(course, date, exportRows)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canManage && (
            <Button size="sm" onClick={persist} className="gap-2">
              <Save className="h-4 w-4" />
              Save attendance
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Course</label>
            <select
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              {COURSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <Input label="Session date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Session attendance', value: `${attendancePercent}%`, icon: CalendarCheck, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Present', value: counts.present, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Absent', value: counts.absent, icon: UserX, cls: 'bg-red-50 text-red-700' },
          { label: 'Late', value: counts.late, icon: Clock3, cls: 'bg-amber-50 text-amber-700' },
          { label: 'Excused', value: counts.excused, icon: Users, cls: 'bg-violet-50 text-violet-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-xl p-2.5 ${item.cls}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-xl font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Attendance saved. The student records module now reflects the recalculated percentages.
        </div>
      )}

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Mark session</CardTitle>
              <CardDescription>{course} • {date}</CardDescription>
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <Button key={option.value} variant="outline" size="sm" onClick={() => setAll(option.value)}>
                    Set all {option.label.toLowerCase()}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student or register number"
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Register no.</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 text-center font-medium">Current overall</th>
                  <th className="px-4 py-3 font-medium">This session</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const current = records[student.id] ?? 'present'
                  const meta = STATUS_OPTIONS.find((item) => item.value === current)!
                  return (
                    <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.batch}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">{student.regNo}</td>
                      <td className="px-4 py-4 text-slate-600">{student.department}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-semibold ${student.attendance >= 75 ? 'text-emerald-700' : student.attendance >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                          {student.attendance}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <select
                            value={current}
                            onChange={(event) => {
                              setRecords({ ...records, [student.id]: event.target.value as AttendanceStatus })
                              setSaved(false)
                            }}
                            disabled={!canManage}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <Badge variant={meta.badge} size="sm">{meta.label}</Badge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent saved sessions</CardTitle>
          <CardDescription>Stored in the browser as part of the zero-cost demo workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sessions.slice(0, 6).map((session) => {
            const present = Object.values(session.records).filter((value) => value === 'present' || value === 'excused').length
            return (
              <div key={session.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{session.course}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" /> {session.date}
                    </p>
                  </div>
                  {canManage ? (
                    <Badge variant="secondary" size="sm">{present}/{Object.keys(session.records).length}</Badge>
                  ) : (
                    <Badge
                      variant={
                        session.records[scopedStudents[0]?.id] === 'present' || session.records[scopedStudents[0]?.id] === 'excused'
                          ? 'success'
                          : session.records[scopedStudents[0]?.id] === 'late'
                            ? 'warning'
                            : 'danger'
                      }
                      size="sm"
                    >
                      {session.records[scopedStudents[0]?.id] ?? 'not marked'}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
