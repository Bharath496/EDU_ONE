'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCheck,
  GraduationCap,
  IndianRupee,
  Megaphone,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

type AlertItem = {
  id: string
  type: 'student' | 'fee' | 'notice' | 'exam'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  date: string
}

export default function AlertsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const fees = useEduStore((state) => state.fees)
  const notices = useEduStore((state) => state.notices)
  const exams = useEduStore((state) => state.exams)

  const [filter, setFilter] = useState('all')
  const [readIds, setReadIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('eduone-read-alerts')
      if (raw) setReadIds(JSON.parse(raw))
    } catch {
      setReadIds([])
    }
  }, [])

  const alerts = useMemo<AlertItem[]>(() => {
    const result: AlertItem[] = []

    students.forEach((student) => {
      if (student.attendance < 75 || student.cgpa < 6) {
        result.push({
          id: `student-${student.id}`,
          type: 'student',
          title: 'Student needs attention',
          description: `${student.name} has ${student.attendance}% attendance and ${student.cgpa.toFixed(1)} CGPA.`,
          severity: student.attendance < 65 || student.cgpa < 6 ? 'high' : 'medium',
          date: '2026-10-12',
        })
      }
    })

    fees
      .filter((fee) => fee.status === 'overdue' || fee.status === 'pending')
      .forEach((fee) => {
        const student = students.find((item) => item.id === fee.studentId)
        result.push({
          id: `fee-${fee.id}`,
          type: 'fee',
          title: fee.status === 'overdue' ? 'Overdue fee' : 'Fee payment pending',
          description: `${student?.name ?? 'Student'} • ${fee.feeType} • ₹${fee.amount.toLocaleString('en-IN')} due ${fee.dueDate}.`,
          severity: fee.status === 'overdue' ? 'high' : 'medium',
          date: fee.dueDate,
        })
      })

    notices
      .filter((notice) => notice.priority === 'urgent' || notice.priority === 'high')
      .forEach((notice) => {
        result.push({
          id: `notice-${notice.id}`,
          type: 'notice',
          title: notice.title,
          description: `${notice.author} • ${notice.target}`,
          severity: notice.priority === 'urgent' ? 'high' : 'medium',
          date: notice.publishedAt.slice(0, 10),
        })
      })

    exams
      .filter((exam) => exam.status === 'upcoming')
      .forEach((exam) => {
        result.push({
          id: `exam-${exam.id}`,
          type: 'exam',
          title: 'Upcoming exam',
          description: `${exam.name} • ${exam.course} • ${exam.date} at ${exam.startTime}.`,
          severity: 'low',
          date: exam.date,
        })
      })

    return result.sort((a, b) => b.date.localeCompare(a.date))
  }, [exams, fees, notices, students])

  const filtered = alerts.filter((alert) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !readIds.includes(alert.id)
    return alert.severity === filter
  })

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const saveRead = (ids: string[]) => {
    setReadIds(ids)
    localStorage.setItem('eduone-read-alerts', JSON.stringify(ids))
  }

  const toggleRead = (id: string) => {
    saveRead(readIds.includes(id) ? readIds.filter((item) => item !== id) : [...readIds, id])
  }

  const unreadCount = alerts.filter((alert) => !readIds.includes(alert.id)).length

  const iconFor = (type: AlertItem['type']) => {
    if (type === 'student') return GraduationCap
    if (type === 'fee') return IndianRupee
    if (type === 'notice') return Megaphone
    return Calendar
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">Live alerts generated from current student, fee, notice and exam data.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => saveRead(alerts.map((item) => item.id))}>
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600"><span className="font-bold text-slate-950">{unreadCount}</span> unread alerts</p>
        <div className="flex flex-wrap gap-2">
          {['all', 'unread', 'high', 'medium', 'low'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === item ? 'bg-primary-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => {
          const Icon = iconFor(alert.type)
          const read = readIds.includes(alert.id)
          return (
            <Card key={alert.id} className={!read ? 'border-l-4 border-l-primary-500' : ''}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`rounded-xl p-2.5 ${alert.severity === 'high' ? 'bg-red-50 text-red-700' : alert.severity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <button onClick={() => toggleRead(alert.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{alert.title}</h3>
                    {!read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    <Badge variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'secondary'} size="sm">{alert.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{alert.date} • click to {read ? 'mark unread' : 'mark read'}</p>
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!filtered.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-800">No alerts in this filter</p>
          <p className="text-sm text-slate-500">Human civilization survives another notification cycle.</p>
        </div>
      )}
    </div>
  )
}
