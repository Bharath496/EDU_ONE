'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BriefcaseBusiness } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

type Opportunity = { id: string; company: string; title: string; status: string; application_deadline: string }
type Application = { id: string; student_name: string; registration_number: string; status: string; application_note?: string }

export default function InstitutionalPlacementsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('full_time')
  const [eligibility, setEligibility] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await api.getPlacementOpportunities()
      setOpportunities(Array.isArray(rows) ? rows : [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load placement opportunities.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Placement Officer', 'College Admin'].includes(user.role)) { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const loadApplications = async (opportunityId: string) => {
    setSelectedId(opportunityId)
    setApplications([])
    setError('')
    try {
      const rows = await api.getOpportunityApplications(opportunityId)
      setApplications(rows || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load applications.')
    }
  }

  const createOpportunity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.createPlacementOpportunity({
        company, title, description, location: location || undefined,
        employment_type: employmentType as 'full_time' | 'internship' | 'part_time' | 'contract',
        eligibility_text: eligibility || undefined,
        application_deadline: new Date(deadline).toISOString(),
      })
      setCompany(''); setTitle(''); setDescription(''); setLocation(''); setEligibility(''); setDeadline('')
      setSuccess('Placement opportunity published.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not publish this opportunity.')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (applicationId: string, nextStatus: 'shortlisted' | 'interview' | 'selected' | 'rejected') => {
    setError('')
    try {
      await api.updatePlacementApplicationStatus(applicationId, nextStatus)
      if (selectedId) await loadApplications(selectedId)
      setSuccess('Application status updated.')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update application status.')
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading placement management...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Placement management</h1><p className="text-sm text-slate-500">Publish opportunities and manage student application outcomes.</p></div></header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[390px_1fr]">
        <Card><CardContent className="p-5"><div className="mb-5 flex items-center gap-2 font-semibold"><BriefcaseBusiness className="h-4 w-4" /> Publish opportunity</div>
          <form onSubmit={createOpportunity} className="space-y-3">
            <label className="block text-sm">Company<input required value={company} onChange={e => setCompany(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Role title<input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Description<textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
            <label className="block text-sm">Location<input value={location} onChange={e => setLocation(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Employment type<select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="full_time">Full-time</option><option value="internship">Internship</option><option value="part_time">Part-time</option><option value="contract">Contract</option></select></label>
            <label className="block text-sm">Eligibility<input value={eligibility} onChange={e => setEligibility(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Application deadline<input required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <Button type="submit" disabled={saving || !deadline} className="w-full">{saving ? 'Publishing...' : 'Publish opportunity'}</Button>
          </form>
        </CardContent></Card>
        <div className="space-y-6">
          {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
          {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
          <Card><CardContent className="p-5"><h2 className="font-semibold">Published opportunities</h2><div className="mt-4 space-y-3">{opportunities.map(item => <div key={item.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"><div><p className="font-medium">{item.title} · {item.company}</p><p className="text-xs text-slate-500">Deadline {new Date(item.application_deadline).toLocaleString()}</p></div><Button size="sm" variant={selectedId === item.id ? 'primary' : 'outline'} onClick={() => void loadApplications(item.id)}>View applications</Button></div>)}{opportunities.length === 0 && <p className="text-sm text-slate-500">No opportunities have been published.</p>}</div></CardContent></Card>
          {selectedId && <Card><CardContent className="p-5"><h2 className="font-semibold">Applications ({applications.length})</h2><div className="mt-4 space-y-4">{applications.map(item => <div key={item.id} className="border-b border-slate-100 pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{item.student_name}</p><p className="text-xs text-slate-500">{item.registration_number}</p><p className="mt-2 text-sm text-slate-600">{item.application_note || 'No application note provided.'}</p></div><span className="text-sm text-slate-500">{item.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{(['shortlisted','interview','selected','rejected'] as const).map(state => <button key={state} onClick={() => void updateStatus(item.id, state)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium capitalize text-slate-700 hover:bg-slate-50">{state}</button>)}</div></div>)}{applications.length === 0 && <p className="text-sm text-slate-500">No applications received yet.</p>}</div></CardContent></Card>}
        </div>
      </div>
    </main>
  )
}
