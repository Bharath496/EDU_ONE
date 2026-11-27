'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'

type RiskItem = {
  student_profile_id: string
  registration_number: string
  student_name: string | null
  department_id: string | null
  class_id: string | null
  attendance_percentage: number | null
  attendance_sessions: number
  average_marks_percentage: number | null
  published_exams: number
  risk_level: 'high' | 'medium' | 'watch' | 'on_track' | 'insufficient_data'
  risk_score: number | null
  reasons: string[]
  review_required: boolean
}

type RiskSummary = {
  high: number
  medium: number
  watch: number
  on_track: number
  insufficient_data: number
}

const REPORT_ROLES = ['College Admin', 'Principal', 'Vice Principal', 'HOD', 'Class Advisor', 'Exam Cell', 'Placement Officer', 'Admissions']

const levelLabel: Record<RiskItem['risk_level'], string> = {
  high: 'High review priority',
  medium: 'Needs review',
  watch: 'Monitor',
  on_track: 'No current signal',
  insufficient_data: 'Insufficient data',
}

export default function InstitutionalAnalyticsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [items, setItems] = useState<RiskItem[]>([])
  const [summary, setSummary] = useState<RiskSummary>({ high: 0, medium: 0, watch: 0, on_track: 0, insufficient_data: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 100

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.getStudentRiskReport({ page, limit })
      setItems(result.items as RiskItem[])
      setSummary(result.summary as RiskSummary)
      setTotal(result.total as number)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load student-support analytics.')
      setItems([])
      setTotal(0)
      setSummary({ high: 0, medium: 0, watch: 0, on_track: 0, insufficient_data: 0 })
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) router.replace('/auth/sign-in')
  }, [authLoading, isAuthenticated, router, user])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && REPORT_ROLES.includes(user.role)) void load()
  }, [authLoading, isAuthenticated, load, user])

  if (authLoading || (loading && user && REPORT_ROLES.includes(user.role))) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading student-support signals...</main>
  }

  if (!isAuthenticated || !user) return null

  if (!REPORT_ROLES.includes(user.role)) {
    return <main className="mx-auto max-w-3xl p-8"><Card><CardContent className="p-6"><h1 className="font-semibold text-slate-950">Access restricted</h1><p className="mt-2 text-sm text-slate-600">Your role cannot view student-support analytics.</p><Button className="mt-4" onClick={() => router.replace('/institutional')}>Return to workspace</Button></CardContent></Card></main>
  }

  const summaryCards: { key: keyof RiskSummary; label: string }[] = [
    { key: 'high', label: 'High review priority' },
    { key: 'medium', label: 'Needs review' },
    { key: 'watch', label: 'Monitor' },
    { key: 'insufficient_data', label: 'Insufficient data' },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Academic support</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">Student early-support signals</h1>
            <p className="mt-1 text-sm text-slate-500">{user.collegeName} · {total} student records in your scope</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/institutional')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Workspace</Button>
            <Button variant="outline" onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <Card>
          <CardContent className="flex items-start gap-3 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-slate-900">Support signal only — not a student label</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Signals use attendance from locked sessions and marks from published exams. Missing records are shown as insufficient data, never treated as zero. These indicators do not diagnose a student or trigger automatic action. Review the context with the student before deciding on support.</p>
            </div>
          </CardContent>
        </Card>

        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <Card key={item.key}>
              <CardHeader className="pb-2"><CardDescription>{item.label}</CardDescription><CardTitle className="text-2xl tabular-nums">{summary[item.key]}</CardTitle></CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Students in your authorized scope</CardTitle>
            <CardDescription>Risk score is a transparent rule-based signal out of 6. Summary counts apply to this page.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Student</th><th className="px-3 py-3">Attendance</th><th className="px-3 py-3">Published marks</th><th className="px-3 py-3">Signal</th><th className="px-3 py-3">Reason</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.student_profile_id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-4"><p className="font-medium text-slate-900">{item.student_name || 'Student'}</p><p className="mt-1 text-xs text-slate-500">{item.registration_number}</p></td>
                    <td className="px-3 py-4">{item.attendance_percentage === null ? '—' : `${item.attendance_percentage}%`}<p className="mt-1 text-xs text-slate-500">{item.attendance_sessions} locked sessions</p></td>
                    <td className="px-3 py-4">{item.average_marks_percentage === null ? '—' : `${item.average_marks_percentage}%`}<p className="mt-1 text-xs text-slate-500">{item.published_exams} published exams</p></td>
                    <td className="px-3 py-4"><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{levelLabel[item.risk_level]}</span>{item.risk_score !== null && <p className="mt-2 text-xs text-slate-500">Score {item.risk_score}/6</p>}</td>
                    <td className="px-3 py-4 text-xs leading-5 text-slate-600">{item.reasons.length ? item.reasons.join('; ') : item.risk_level === 'insufficient_data' ? 'Not enough finalized data' : 'No threshold crossed'}</td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">{loading ? 'Loading...' : 'No students are available in this scope.'}</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} · {items.length} shown · {total} total</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <Button variant="outline" disabled={page * limit >= total || loading} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
