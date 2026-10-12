'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  Download,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useEduStore } from '@/lib/edu-store'
import type { StudentRecord } from '@/lib/demo-data'

function getRisk(student: StudentRecord) {
  let points = 0
  const reasons: string[] = []

  if (student.cgpa < 6) {
    points += 3
    reasons.push('CGPA below 6.0')
  } else if (student.cgpa < 7) {
    points += 2
    reasons.push('CGPA below 7.0')
  } else if (student.cgpa < 8) {
    points += 1
    reasons.push('CGPA below 8.0')
  }

  if (student.attendance < 65) {
    points += 3
    reasons.push('attendance below 65%')
  } else if (student.attendance < 75) {
    points += 2
    reasons.push('attendance below 75%')
  } else if (student.attendance < 85) {
    points += 1
    reasons.push('attendance below 85%')
  }

  if (student.status === 'inactive') {
    points += 1
    reasons.push('student record inactive')
  }

  if (!reasons.length) reasons.push('on track')

  if (points >= 5) return { level: 'High', tone: 'danger' as const, points, reasons }
  if (points >= 3) return { level: 'Medium', tone: 'warning' as const, points, reasons }
  return { level: 'Low', tone: 'success' as const, points, reasons }
}

function exportCsv(rows: StudentRecord[]) {
  const csv = [
    ['Register No', 'Student', 'Department', 'Semester', 'Attendance', 'CGPA', 'Risk', 'Reasons'],
    ...rows.map((student) => {
      const risk = getRisk(student)
      return [
        student.regNo,
        student.name,
        student.department,
        student.semester,
        student.attendance,
        student.cgpa,
        risk.level,
        risk.reasons.join('; '),
      ]
    }),
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'eduone-student-intelligence.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function StudentIntelligencePage() {
  const students = useEduStore((state) => state.students)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')

  const departments = ['All', ...Array.from(new Set(students.map((item) => item.department))).sort()]

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return students.filter((student) => {
      const risk = getRisk(student)
      const matchesDepartment = department === 'All' || student.department === department
      const matchesRisk = riskFilter === 'All' || risk.level === riskFilter
      const matchesQuery =
        !needle ||
        student.name.toLowerCase().includes(needle) ||
        student.regNo.toLowerCase().includes(needle)
      return matchesDepartment && matchesRisk && matchesQuery
    })
  }, [department, query, riskFilter, students])

  const highRisk = students.filter((student) => getRisk(student).level === 'High').length
  const mediumRisk = students.filter((student) => getRisk(student).level === 'Medium').length
  const avgCgpa = students.reduce((sum, item) => sum + item.cgpa, 0) / Math.max(students.length, 1)
  const avgAttendance = students.reduce((sum, item) => sum + item.attendance, 0) / Math.max(students.length, 1)

  const departmentRisk = departments
    .filter((item) => item !== 'All')
    .map((item) => {
      const group = students.filter((student) => student.department === item)
      const flagged = group.filter((student) => getRisk(student).level !== 'Low').length
      return { department: item, flagged, total: group.length }
    })
    .sort((a, b) => b.flagged - a.flagged)

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">EDU_ONE Analytics</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Student Intelligence</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Explainable risk monitoring built from the live student and attendance data already used elsewhere in the app.
            No paid AI API and no mystery prediction score.
          </p>
        </div>
        <Button onClick={() => exportCsv(filtered)} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export current view
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Average CGPA', value: avgCgpa.toFixed(1), icon: Award, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Attendance', value: `${avgAttendance.toFixed(1)}%`, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Medium risk', value: mediumRisk, icon: TrendingUp, cls: 'bg-amber-50 text-amber-700' },
          { label: 'High risk', value: highRisk, icon: AlertTriangle, cls: 'bg-red-50 text-red-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Risk monitor</CardTitle>
            <CardDescription>Risk is based only on visible CGPA, attendance and active-record thresholds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_160px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student or register number"
                leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              />
              <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                {departments.map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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
                    <th className="px-3 py-3 font-medium">CGPA</th>
                    <th className="px-3 py-3 font-medium">Risk</th>
                    <th className="px-3 py-3 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const risk = getRisk(student)
                    return (
                      <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-slate-900">{student.name}</div>
                          <div className="font-mono text-xs text-slate-500">{student.regNo}</div>
                        </td>
                        <td className="px-3 py-4 text-slate-600">{student.department}</td>
                        <td className="px-3 py-4 text-slate-600">{student.semester}</td>
                        <td className="px-3 py-4">
                          <span className={student.attendance >= 75 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>{student.attendance}%</span>
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-700">{student.cgpa.toFixed(1)}</td>
                        <td className="px-3 py-4"><Badge variant={risk.tone}>{risk.level}</Badge></td>
                        <td className="px-3 py-4 text-slate-600">{risk.reasons.join(', ')}</td>
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
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary-600" />Department watchlist</CardTitle>
            <CardDescription>Students with Medium or High risk by department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentRisk.map((row) => {
              const percent = row.total ? Math.round((row.flagged / row.total) * 100) : 0
              return (
                <div key={row.department}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{row.department}</span>
                    <span className="text-slate-500">{row.flagged}/{row.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Explainable thresholds</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">Every alert is traceable to CGPA, attendance, or record status. Staff can challenge the rule instead of trusting an opaque model.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Connected data</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">Marking attendance elsewhere updates this module automatically because both screens use the same persisted data store.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Zero-cost architecture</CardTitle></CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">The portfolio demo runs in-browser and exports CSV without requiring a database subscription, analytics service, or LLM API.</CardContent>
        </Card>
      </div>
    </div>
  )
}
