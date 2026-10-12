'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Database,
  Download,
  LogOut,
  RefreshCcw,
  Save,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore, type WorkspaceSnapshot } from '@/lib/edu-store'

type NotificationPrefs = {
  email: boolean
  browser: boolean
  attendance: boolean
  fees: boolean
  notices: boolean
}

const defaultPrefs: NotificationPrefs = {
  email: true,
  browser: true,
  attendance: true,
  fees: true,
  notices: true,
}

export default function SettingsPage() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore()
  const router = useRouter()
  const resetDemo = useEduStore((state) => state.resetDemo)
  const restoreSnapshot = useEduStore((state) => state.restoreSnapshot)
  const students = useEduStore((state) => state.students)
  const attendanceSessions = useEduStore((state) => state.attendanceSessions)
  const assignments = useEduStore((state) => state.assignments)
  const notices = useEduStore((state) => state.notices)
  const fees = useEduStore((state) => state.fees)
  const exams = useEduStore((state) => state.exams)
  const faculty = useEduStore((state) => state.faculty)
  const books = useEduStore((state) => state.books)
  const marks = useEduStore((state) => state.marks)
  const assignmentSubmissions = useEduStore((state) => state.assignmentSubmissions)

  const [tab, setTab] = useState<'account' | 'notifications' | 'workspace'>('account')
  const [name, setName] = useState(user?.name ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)
  const [message, setMessage] = useState('')
  const canManageWorkspace = user?.role === 'College Admin' || user?.role === 'Super Admin'

  useEffect(() => {
    const raw = localStorage.getItem('eduone-notification-prefs')
    if (!raw) return
    try {
      setPrefs({ ...defaultPrefs, ...JSON.parse(raw) })
    } catch {
      setPrefs(defaultPrefs)
    }
  }, [])

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2500)
  }

  const saveAccount = (event: FormEvent) => {
    event.preventDefault()
    setUser({
      ...user,
      name: name.trim() || user.name,
      department: department.trim() || undefined,
    })
    flash('Account details saved.')
  }

  const savePrefs = () => {
    localStorage.setItem('eduone-notification-prefs', JSON.stringify(prefs))
    flash('Notification preferences saved.')
  }

  const exportSnapshot = () => {
    if (!canManageWorkspace) return
    const payload: WorkspaceSnapshot = {
      students,
      attendanceSessions,
      assignments,
      notices,
      fees,
      exams,
      faculty,
      books,
      marks,
      assignmentSubmissions,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `eduone-workspace-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    flash('Workspace backup downloaded.')
  }

  const importSnapshot = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canManageWorkspace) return
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as Partial<WorkspaceSnapshot>
      if (
        !Array.isArray(parsed.students) ||
        !Array.isArray(parsed.attendanceSessions) ||
        !Array.isArray(parsed.assignments) ||
        !Array.isArray(parsed.notices) ||
        !Array.isArray(parsed.fees) ||
        !Array.isArray(parsed.exams) ||
        !Array.isArray(parsed.faculty) ||
        !Array.isArray(parsed.books) ||
        !Array.isArray(parsed.marks)
      ) {
        throw new Error('Invalid EDU_ONE snapshot')
      }
      restoreSnapshot(parsed as WorkspaceSnapshot)
      flash('Workspace restored from backup.')
    } catch {
      flash('Could not import that backup file.')
    } finally {
      event.target.value = ''
    }
  }

  const resetWorkspace = () => {
    if (!canManageWorkspace) return
    if (window.confirm('Reset all EDU_ONE demo data in this browser to the default workspace?')) {
      resetDemo()
      flash('Demo workspace reset.')
    }
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    ...(canManageWorkspace
      ? [{ id: 'workspace' as const, label: 'Workspace', icon: Database }]
      : []),
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManageWorkspace
              ? 'Account preferences and zero-cost workspace controls.'
              : 'Account and notification preferences for this role.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
          onClick={() => {
            clearAuth()
            router.push('/login')
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">{user.name}</h2>
              <Badge variant="primary">{user.role}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-primary-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'account' && (
        <Card>
          <CardHeader>
            <CardTitle>Account profile</CardTitle>
            <CardDescription>These values are stored with the demo session.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveAccount} className="grid gap-4 md:grid-cols-2">
              <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="Email" value={user.email} disabled />
              <Input label="Role" value={user.role} disabled />
              <Input label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. AIML" />
              <div className="md:col-span-2">
                <Button type="submit" className="gap-2"><Save className="h-4 w-4" />Save account</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
            <CardDescription>Stored locally. External email/SMS delivery is deliberately not faked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              ['email', 'Email summaries', 'Preference only; no external mail service is connected.'],
              ['browser', 'Browser alerts', 'Use in-app/browser notifications when implemented by the host.'],
              ['attendance', 'Attendance alerts', 'Prioritize attendance-related notices.'],
              ['fees', 'Fee reminders', 'Prioritize due and overdue fee reminders.'],
              ['notices', 'Institution notices', 'Show announcement alerts in the workspace.'],
            ].map(([key, label, desc]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs[key as keyof NotificationPrefs]}
                  onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-primary-600"
                />
              </label>
            ))}
            <div className="pt-4">
              <Button onClick={savePrefs} className="gap-2"><Save className="h-4 w-4" />Save preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'workspace' && canManageWorkspace && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" />Local-first workspace</CardTitle>
              <CardDescription>Your interactive demo data is stored in this browser. No paid database is required.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-5">
                {[
                  ['Students', students.length],
                  ['Attendance', attendanceSessions.length],
                  ['Assignments', assignments.length],
                  ['Notices', notices.length],
                  ['Fees', fees.length],
                  ['Exams', exams.length],
                  ['Faculty', faculty.length],
                  ['Books', books.length],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-950">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup & restore</CardTitle>
              <CardDescription>Move the demo workspace between browsers with a JSON snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={exportSnapshot} className="gap-2"><Download className="h-4 w-4" />Export backup</Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Import backup
                <input type="file" accept="application/json,.json" onChange={importSnapshot} className="hidden" />
              </label>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Reset demo workspace</CardTitle>
              <CardDescription>Restore the original sample students, attendance, assignments, notices and fees.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={resetWorkspace} className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                <RefreshCcw className="h-4 w-4" />
                Reset demo data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
