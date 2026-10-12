'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  BarChart3,
  Download,
  Search,
  TrendingUp,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

function grade(total: number) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'F'
}

export default function MarksPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const marks = useEduStore((state) => state.marks)
  const updateMark = useEduStore((state) => state.updateMark)
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('All')

  const courses = ['All', ...Array.from(new Set(marks.map((item) => item.course))).sort()]
  const enriched = marks
    .map((mark) => {
      const student = students.find((item) => item.id === mark.studentId)
      const total = mark.internal + mark.external
      return {
        ...mark,
        student,
        total,
        grade: grade(total),
      }
    })
    .filter((row) => {
      const needle = search.trim().toLowerCase()
      const matchesCourse = course === 'All' || row.course === course
      const matchesSearch =
        !needle ||
        row.student?.name.toLowerCase().includes(needle) ||
        row.student?.regNo.toLowerCase().includes(needle)
      return matchesCourse && matchesSearch
    })

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const avg = enriched.length ? Math.round(enriched.reduce((sum, row) => sum + row.total, 0) / enriched.length) : 0
  const topScore = enriched.length ? Math.max(...enriched.map((row) => row.total)) : 0
  const passCount = enriched.filter((row) => row.total >= 40).length
  const passRate = enriched.length ? Math.round((passCount / enriched.length) * 100) : 0

  const exportCsv = () => {
    const csv = [
      ['Register No', 'Student', 'Course', 'Internal', 'External', 'Total', 'Grade', 'Status'],
      ...enriched.map((row) => [
        row.student?.regNo ?? '-',
        row.student?.name ?? 'Unknown',
        row.course,
        row.internal,
        row.external,
        row.total,
        row.grade,
        row.total >= 40 ? 'Pass' : 'Fail',
      ]),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'eduone-marks.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Marks & Grades</h1>
          <p className="mt-1 text-sm text-slate-500">Edit internal and external marks directly. Changes persist in the browser workspace.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Class average', value: `${avg}%`, icon: BarChart3, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Highest score', value: `${topScore}%`, icon: TrendingUp, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pass count', value: `${passCount}/${enriched.length}`, icon: Award, cls: 'bg-violet-50 text-violet-700' },
          { label: 'Pass rate', value: `${passRate}%`, icon: Award, cls: 'bg-amber-50 text-amber-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_260px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or register number" leftIcon={<Search className="h-4 w-4 text-slate-400" />} />
          <select value={course} onChange={(event) => setCourse(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            {courses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 text-center font-medium">Internal / 50</th>
                  <th className="px-4 py-3 text-center font-medium">External / 50</th>
                  <th className="px-4 py-3 text-center font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Grade</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enriched
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.student?.name ?? 'Unknown'} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{row.student?.name ?? 'Unknown'}</p>
                            <p className="font-mono text-xs text-slate-500">{row.student?.regNo ?? row.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{row.course}</td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={row.internal}
                          onChange={(event) => updateMark(row.id, Number(event.target.value), row.external)}
                          className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-center outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={row.external}
                          onChange={(event) => updateMark(row.id, row.internal, Number(event.target.value))}
                          className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-center outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-950">{row.total}/100</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={row.grade === 'A+' || row.grade === 'A' ? 'success' : row.grade.startsWith('B') ? 'primary' : row.grade === 'F' ? 'danger' : 'warning'} size="sm">{row.grade}</Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={row.total >= 40 ? 'success' : 'danger'} size="sm">{row.total >= 40 ? 'Pass' : 'Fail'}</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
