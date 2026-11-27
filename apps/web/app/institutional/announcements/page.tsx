'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

const publisherRoles = ['College Admin', 'Principal', 'Vice Principal', 'HOD', 'Class Advisor']

export default function InstitutionalAnnouncementsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const canPublish = publisherRoles.includes(user?.role || '')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [audienceRole, setAudienceRole] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [classId, setClassId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setAnnouncements(await api.getInstitutionalAnnouncements() || []) }
    catch (err: any) { setError(err?.response?.data?.detail || 'Unable to load announcements.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.createInstitutionalAnnouncement({
        title, body, category,
        audience_role: audienceRole || undefined,
        department_id: user?.role === 'HOD' ? departmentId : undefined,
        class_id: user?.role === 'Class Advisor' ? classId : undefined,
      })
      setTitle(''); setBody(''); setAudienceRole('')
      setSuccess('Announcement published.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not publish announcement.')
    } finally { setSaving(false) }
  }

  const markRead = async (id: string) => {
    try {
      await api.markInstitutionalAnnouncementRead(id)
      setAnnouncements(rows => rows.map(row => row.id === id ? { ...row, is_read: true } : row))
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not mark announcement as read.')
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading announcements...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Announcements</h1><p className="text-sm text-slate-500">Institution, department, class and role-targeted notices.</p></div></header>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[380px_1fr]">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:col-span-2">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 lg:col-span-2">{success}</div>}
        {canPublish && <Card><CardContent className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Publish announcement</h2><form onSubmit={publish} className="space-y-3">
          <label className="block text-sm">Title<input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block text-sm">Message<textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
          <label className="block text-sm">Category<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="general">General</option><option value="academic">Academic</option><option value="exam">Exam</option><option value="placement">Placement</option><option value="event">Event</option><option value="finance">Finance</option></select></label>
          <label className="block text-sm">Audience role (optional)<select value={audienceRole} onChange={e => setAudienceRole(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">All roles in selected scope</option>{['Student','Parent','Faculty','HOD','Class Advisor','Principal','Vice Principal','Exam Cell','Accounts','Librarian','Placement Officer','Support Staff'].map(role => <option key={role}>{role}</option>)}</select></label>
          {user?.role === 'HOD' && <label className="block text-sm">Your department ID<input required value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>}
          {user?.role === 'Class Advisor' && <label className="block text-sm">Your class ID<input required value={classId} onChange={e => setClassId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>}
          <Button type="submit" disabled={saving} className="w-full">{saving ? 'Publishing...' : 'Publish'}</Button>
        </form></CardContent></Card>}
        <div className="space-y-4">{announcements.map(item => <Card key={item.id}><CardContent className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{item.category}</span><span className="text-xs text-slate-500">{item.is_read ? 'Read' : 'Unread'}</span></div><h2 className="mt-2 font-semibold text-slate-950">{item.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{item.body}</p><div className="mt-4 flex items-center justify-between"><span className="text-xs text-slate-500">{item.published_at ? new Date(item.published_at).toLocaleString() : ''}</span>{!item.is_read && <Button size="sm" variant="outline" onClick={() => void markRead(item.id)}>Mark read</Button>}</div></CardContent></Card>)}{announcements.length === 0 && <Card><CardContent className="p-6 text-sm text-slate-500">No announcements are available for your account.</CardContent></Card>}</div>
      </div>
    </main>
  )
}
