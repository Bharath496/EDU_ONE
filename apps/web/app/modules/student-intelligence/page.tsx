'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Download,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Student = {
  id: string
  name: string
  department: string
  semester: number
  attendance: number
  score: number
  trend: number
}

const students: Student[] = [
  { id: 'BAM018', name: 'Aarav Kumar', department: 'AIML', semester: 5, attendance: 94, score: 86, trend: 5 },
  { id: 'BAM027', name: 'Diya S', department: 'AIML', semester: 5, attendance: 72, score: 58, trend: -6 },
  { id: 'CSE104', name: 'Kavin Raj', department: 'CSE', semester: 3, attendance: 81, score: 67, trend: 2 },
  { id: 'DS041', name: 'Meera N', department: 'Data Science', semester: 4, attendance: 63, score: 49, trend: -9 },
  { id: 'IT088', name: 'Nithin P', department: 'IT', semester: 2, attendance: 88, score: 73, trend: 4 },
  { id: 'ECE063', name: 'Priya V', department: 'ECE', semester: 6, attendance: 76, score: 61, trend: -2 },
  { id: 'CSE121', name: 'Rohit M', department: 'CSE', semester: 3, attendance: 97, score: 91, trend: 7 },
  { id: 'DS052', name: 'Sanjana K', department: 'Data Science', semester: 4, attendance: 69, score: 55, trend: -3 },
]

function getRisk(student: Student) {
  let points = 0
  if (student.score < 50) points += 3
  else if (student.score < 60) points += 2
  else if (student.score < 70) points += 1

  if (student.attendance < 65) points += 3
  else if (student.attendance < 75) points += 2
  else if (student.attendance < 85) points += 1

  if (student.trend <= -5) points += 1

  if (points >= 5) return { level: 'High', tone: 'danger' as const, points }
  if (points >= 3) return { level: 'Medium', tone: 'warning' as const, points }
  return { level: 'Low', tone: 'success' as const, points }
}

function reason(student: Student) {
  const items = []
  if (student.score < 60) items.push('low academic score')
  else if (student.score < 70) items.push('score needs improvement')
  if (student.attendance < 75) items.push('low attendance')
  else if (student.attendance < 85) items.push('attendance watch')
  if (student.trend <= -5) items.push('declining trend')
  return items.length ? items.join(', ') : 'on track'
}

function exportCsv(rows: Student[]) {
  const header = 'student_id,name,department,semester,attendance,score,trend,risk,reason'
  const body = rows.map((student) => {
    const risk = getRisk(student)
    return [
      student.id,
      student.name,
      student.department,
      student.semester,
      student.attendance,
      student.score,
      student.trend,
      risk.level,
      reason(student),
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')
  })
  const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'eduone-student-intelligence.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function StudentIntelligencePage() {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All')

  const departments = ['All', ...Array.from(new Set(students.map((item) => item.department)))]
  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesDepartment = department === 'All' || student.department === department
      const needle = query.trim().toLowerCase()
      const matchesQuery =
        !needle ||
        student.name.toLowerCase().includes(needle) ||
        student.id.toLowerCase().includes(needle)
      return matchesDepartment && matchesQuery
    })
  }, [department, query])

  const highRisk = filtered.filter((student) => getRisk(student).level === 'High').length
  const avgScore = filtered.reduce((sum, item) => sum + item.score, 0) / Math.max(filtered.length, 1)
  const avgAttendance = filtered.reduce((sum, item) => sum + item.attendance, 0) / Math.max(filtered.length, 1)

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-950">Student Intelligence</h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Explainable academic-risk monitoring using attendance, marks, and recent performance trend. No paid AI API required.
            </p>
          </div>
          <Button onClick={() => exportCsv(filtered)} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Students</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{filtered.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Average score</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{avgScore.toFixed(1)}%</p>
                </div>
                <Award className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Attendance</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{avgAttendance.toFixed(1)}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">High-risk alerts</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{highRisk}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Risk monitor</CardTitle>
            <CardDescription>
              The score is intentionally transparent. Staff can see why a student was flagged instead of trusting a mystery prediction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student or register number"
                leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              />
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                {departments.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">Student</th>
                    <th className="px-3 py-3 font-medium">Department</th>
                    <th className="px-3 py-3 font-medium">Sem</th>
                    <th className="px-3 py-3 font-medium">Attendance</th>
                    <th className="px-3 py-3 font-medium">Score</th>
                    <th className="px-3 py-3 font-medium">Trend</th>
                    <th className="px-3 py-3 font-medium">Risk</th>
                    <th className="px-3 py-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const risk = getRisk(student)
                    return (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.id}</div>
                        </td>
                        <td className="px-3 py-4">{student.department}</td>
                        <td className="px-3 py-4">{student.semester}</td>
                        <td className="px-3 py-4">{student.attendance}%</td>
                        <td className="px-3 py-4">{student.score}%</td>
                        <td className="px-3 py-4">
                          <span className={student.trend >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                            {student.trend > 0 ? '+' : ''}{student.trend}%
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant={risk.tone}>{risk.level}</Badge>
                        </td>
                        <td className="px-3 py-4 text-slate-600">{reason(student)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary-600" />
                Explainable by design
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Every alert comes from visible thresholds for score, attendance, and direction of change.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Early intervention
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Staff can identify students needing attention before low attendance and falling performance become end-semester surprises.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-blue-600" />
                Zero-cost demo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              The module runs entirely in the browser with local demo data and does not require a paid analytics or AI service.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
