'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  GraduationCap,
  IndianRupee,
  Megaphone,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

type ReportType = 'students' | 'attendance' | 'fees' | 'assignments' | 'notices'

function saveCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const attendance = useEduStore((state) => state.attendanceSessions)
  const fees = useEduStore((state) => state.fees)
  const assignments = useEduStore((state) => state.assignments)
  const notices = useEduStore((state) => state.notices)

  const [generated, setGenerated] = useState<string | null>(null)

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const feeCollected = fees.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length)
    : 0

  const cards = useMemo(() => [
    {
      id: 'students' as ReportType,
      title: 'Student Master Report',
      description: 'Register number, department, semester, attendance, CGPA and status.',
      icon: GraduationCap,
      count: students.length,
    },
    {
      id: 'attendance' as ReportType,
      title: 'Attendance Report',
      description: 'Saved session records by course, date and student.',
      icon: UserCheck,
      count: attendance.length,
    },
    {
      id: 'fees' as ReportType,
      title: 'Fee Ledger',
      description: 'Payment status, due dates, methods and current collection.',
      icon: IndianRupee,
      count: fees.length,
    },
    {
      id: 'assignments' as ReportType,
      title: 'Assignment Report',
      description: 'Coursework status, due dates and submission progress.',
      icon: FileSpreadsheet,
      count: assignments.length,
    },
    {
      id: 'notices' as ReportType,
      title: 'Notice Report',
      description: 'Published announcements, audience, priority and engagement.',
      icon: Megaphone,
      count: notices.length,
    },
  ], [assignments.length, attendance.length, fees.length, notices.length, students.length])

  const generate = (type: ReportType) => {
    if (type === 'students') {
      saveCsv('eduone-students-report.csv', [
        ['Register No', 'Student', 'Department', 'Semester', 'Batch', 'Attendance', 'CGPA', 'Status'],
        ...students.map((item) => [item.regNo, item.name, item.department, item.semester, item.batch, item.attendance, item.cgpa, item.status]),
      ])
    }

    if (type === 'attendance') {
      const rows: Array<Array<string | number>> = [['Course', 'Date', 'Register No', 'Student', 'Status']]
      attendance.forEach((session) => {
        Object.entries(session.records).forEach(([studentId, status]) => {
          const student = students.find((item) => item.id === studentId)
          rows.push([session.course, session.date, student?.regNo ?? studentId, student?.name ?? 'Unknown', status])
        })
      })
      saveCsv('eduone-attendance-report.csv', rows)
    }

    if (type === 'fees') {
      saveCsv('eduone-fees-report.csv', [
        ['Register No', 'Student', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Method'],
        ...fees.map((fee) => {
          const student = students.find((item) => item.id === fee.studentId)
          return [student?.regNo ?? '-', student?.name ?? 'Unknown', fee.feeType, fee.amount, fee.dueDate, fee.paidDate ?? '', fee.status, fee.method ?? '']
        }),
      ])
    }

    if (type === 'assignments') {
      saveCsv('eduone-assignments-report.csv', [
        ['Title', 'Course', 'Department', 'Due Date', 'Marks', 'Submissions', 'Class Strength', 'Status'],
        ...assignments.map((item) => [item.title, item.course, item.department, item.dueDate, item.maxMarks, item.submissions, item.totalStudents, item.status]),
      ])
    }

    if (type === 'notices') {
      saveCsv('eduone-notices-report.csv', [
        ['Title', 'Author', 'Audience', 'Priority', 'Published At', 'Pinned', 'Views'],
        ...notices.map((item) => [item.title, item.author, item.target, item.priority, item.publishedAt, item.pinned ? 'Yes' : 'No', item.views]),
      ])
    }

    setGenerated(type)
    window.setTimeout(() => setGenerated(null), 2500)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Reports & Exports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate real CSV files from the same persisted data used across the app. No decorative download buttons pretending to have jobs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Students', value: students.length, note: 'master records' },
          { label: 'Attendance', value: `${avgAttendance}%`, note: `${attendance.length} sessions` },
          { label: 'Collected', value: `₹${feeCollected.toLocaleString('en-IN')}`, note: 'demo ledger' },
          { label: 'Assignments', value: assignments.length, note: `${assignments.filter((item) => item.status === 'published').length} published` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-xs text-slate-400">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {generated && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Report generated and downloaded successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary-600" />Available reports</CardTitle>
          <CardDescription>Each export is generated directly in the browser from current workspace data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((report) => (
            <div key={report.id} className="rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl bg-primary-50 p-3 text-primary-700"><report.icon className="h-5 w-5" /></div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{report.count} records</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">{report.title}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{report.description}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full gap-2" onClick={() => generate(report.id)}>
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why CSV first?</CardTitle>
          <CardDescription>It is portable, auditable, easy to inspect, and costs exactly ₹0 to generate. PDF styling can be added later without inventing a server bill today.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
