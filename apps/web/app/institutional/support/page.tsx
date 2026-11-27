'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MessageSquareText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

export default function InstitutionalSupportPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const manager = ['Support Staff', 'College Admin', 'Principal', 'Vice Principal'].includes(user?.role || '')
  const [tickets, setTickets] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [profileId, setProfileId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<any>(null)
  const [category, setCategory] = useState('Academic')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [resolution, setResolution] = useState('')
  const [nextStatus, setNextStatus] = useState('in_progress')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const rows = await api.getInstitutionalSupportTickets()
      setTickets(rows || [])
      if (user?.role === 'Student') {
        const profile = await api.getMyStudentProfile()
        setProfileId(profile.id)
      } else if (user?.role === 'Parent') {
        const response = await api.getInstitutionalStudents()
        const children = response.items || []
        setStudents(children)
        if (children.length === 1) setProfileId(children[0].id)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load support tickets.')
    } finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Student', 'Parent', 'Support Staff', 'College Admin', 'Principal', 'Vice Principal'].includes(user.role)) { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const openTicket = async (id: string) => {
    setSelectedId(id); setError('')
    try {
      const item = await api.getSupportTicket(id)
      setDetail(item)
      setNextStatus(item.status)
      setResolution(item.resolution || '')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to open this ticket.')
    }
  }

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.createInstitutionalSupportTicket({ student_profile_id: profileId, category, subject, description })
      setSubject(''); setDescription('')
      setSuccess('Support ticket submitted.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not submit this ticket.')
    } finally { setSaving(false) }
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedId || !message.trim()) return
    setSaving(true); setError('')
    try {
      await api.addSupportTicketMessage(selectedId, message)
      setMessage('')
      await openTicket(selectedId)
      setSuccess('Message added.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not add the message.')
    } finally { setSaving(false) }
  }

  const updateTicket = async () => {
    if (!selectedId) return
    setSaving(true); setError('')
    try {
      await api.updateInstitutionalSupportTicket(selectedId, { status: nextStatus as 'open' | 'in_progress' | 'resolved' | 'closed', resolution: resolution || undefined })
      await openTicket(selectedId)
      await load()
      setSuccess('Ticket status updated.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update ticket status.')
    } finally { setSaving(false) }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading support workspace...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Student support</h1><p className="text-sm text-slate-500">Private, institution-scoped ticket tracking and follow-up.</p></div></header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[360px_1fr]">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:col-span-2">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 lg:col-span-2">{success}</div>}
        {!manager && <Card><CardContent className="p-5"><h2 className="mb-4 font-semibold">Raise a support ticket</h2><form onSubmit={createTicket} className="space-y-3">
          {user?.role === 'Parent' && <label className="block text-sm">Student<select required value={profileId} onChange={e => setProfileId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose linked student</option>{students.map(item => <option key={item.id} value={item.id}>{item.registration_number} · {item.name}</option>)}</select></label>}
          <label className="block text-sm">Category<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option>Academic</option><option>Attendance</option><option>Fees</option><option>Facilities</option><option>Library</option><option>Hostel</option><option>Transport</option><option>Other</option></select></label>
          <label className="block text-sm">Subject<input required value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="block text-sm">Description<textarea required minLength={5} rows={5} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
          <Button type="submit" disabled={saving || !profileId} className="w-full">Submit ticket</Button>
        </form></CardContent></Card>}
        <Card><CardContent className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><MessageSquareText className="h-4 w-4" /> {manager ? 'Institution support queue' : 'My support tickets'}</h2><div className="space-y-2">{tickets.map(item => <button key={item.id} onClick={() => void openTicket(item.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === item.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}><div className="flex justify-between gap-2"><span className="font-medium text-slate-800">{item.subject}</span><span className="text-xs text-slate-500">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">{item.registration_number} · {item.category}</p></button>)}{tickets.length === 0 && <p className="text-sm text-slate-500">No support tickets yet.</p>}</div></CardContent></Card>
        {detail && <Card className="lg:col-span-2"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{detail.subject}</h2><p className="mt-1 text-xs text-slate-500">{detail.registration_number} · {detail.category} · {detail.status}</p></div>{manager && <div className="flex flex-wrap gap-2"><select value={nextStatus} onChange={e => setNextStatus(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><Button size="sm" onClick={() => void updateTicket()} disabled={saving}>Update status</Button></div>}</div><p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">{detail.description}</p>
          {manager && <label className="mt-4 block text-sm">Resolution<textarea rows={3} value={resolution} onChange={e => setResolution(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>}
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">{(detail.messages || []).map((item: any) => <div key={item.id} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{item.sender_user_id === user?.id ? 'You' : 'Institution support'} · {new Date(item.created_at).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p></div>)}</div>
          <form onSubmit={sendMessage} className="mt-5 flex flex-col gap-2 sm:flex-row"><input required value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a reply..." className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm" /><Button type="submit" disabled={saving}>Send message</Button></form>
        </CardContent></Card>}
      </div>
    </main>
  )
}
