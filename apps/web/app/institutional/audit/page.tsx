'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'

type AuditEvent = {
  id: string
  action: string
  resource_type: string
  resource_id: string | null
  actor_user_id: string | null
  actor_name: string | null
  actor_email: string | null
  details: Record<string, unknown>
  created_at: string
}

export default function InstitutionalAuditPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [items, setItems] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.getAuditEvents({
        action: action.trim() || undefined,
        resource_type: resourceType.trim() || undefined,
        page: 1,
        limit: 100,
      })
      setItems(result.items as AuditEvent[])
      setTotal(result.total as number)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load audit events.')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [action, resourceType])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) router.replace('/auth/sign-in')
  }, [authLoading, isAuthenticated, router, user])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'College Admin') void load()
  }, [authLoading, isAuthenticated, load, user])

  if (authLoading || (loading && user?.role === 'College Admin')) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading audit history...</main>
  }

  if (!isAuthenticated || !user) return null

  if (user.role !== 'College Admin') {
    return <main className="mx-auto max-w-3xl p-8"><Card><CardContent className="p-6"><h1 className="font-semibold text-slate-950">Access restricted</h1><p className="mt-2 text-sm text-slate-600">Only institution administrators can read the audit history.</p><Button className="mt-4" onClick={() => router.replace('/institutional')}>Return to workspace</Button></CardContent></Card></main>
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Security & governance</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">Institution audit history</h1>
            <p className="mt-1 text-sm text-slate-500">{user.collegeName} · {total} events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/institutional')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Workspace</Button>
            <Button variant="outline" onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-5 py-8">
        <Card>
          <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto]">
            <label className="block text-sm font-medium text-slate-700">
              Action
              <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="e.g. users.created" className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Resource type
              <input value={resourceType} onChange={(event) => setResourceType(event.target.value)} placeholder="e.g. student_profile" className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <div className="flex items-end"><Button onClick={() => void load()}>Apply filters</Button></div>
          </CardContent>
        </Card>

        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}
        <div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4" /> Read-only history. Events are scoped to this institution.</div>

        <Card>
          <CardContent className="divide-y divide-slate-100 p-0">
            {items.length ? items.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.action}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.resource_type}{item.resource_id ? ` · ${item.resource_id}` : ''}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.actor_name || 'System'}{item.actor_email ? ` · ${item.actor_email}` : ''}</p>
                  </div>
                  <time className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString('en-IN')}</time>
                </div>
                {Object.keys(item.details || {}).length > 0 && <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(item.details, null, 2)}</pre>}
              </article>
            )) : <p className="p-6 text-sm text-slate-500">{loading ? 'Loading...' : 'No audit events match these filters.'}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
