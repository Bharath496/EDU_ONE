'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Plus, Search, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function CollegesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const tenants = usePlatformStore((state) => state.tenants)
  const addTenant = usePlatformStore((state) => state.addTenant)
  const toggleTenantStatus = usePlatformStore((state) => state.toggleTenantStatus)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    state: 'Tamil Nadu',
    students: 0,
    plan: 'Starter' as 'Starter' | 'Growth' | 'Campus',
    status: 'trial' as 'active' | 'trial' | 'paused',
    monthlyDemoValue: 6000,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return tenants.filter((tenant) => !needle || tenant.name.toLowerCase().includes(needle) || tenant.code.toLowerCase().includes(needle) || tenant.city.toLowerCase().includes(needle))
  }, [search, tenants])

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return
    addTenant({ ...form, name: form.name.trim(), code: form.code.trim().toUpperCase() })
    setOpen(false)
    setForm({ ...form, name: '', code: '', city: '', students: 0 })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-medium text-primary-600">Platform Admin</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Institutions</h1><p className="mt-1 text-sm text-slate-500">Manage fictional tenant records for the portfolio demo.</p></div>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add institution</Button>
      </div>

      <div className="max-w-md"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search institution, code or city" leftIcon={<Search className="h-4 w-4 text-slate-400" />} /></div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((tenant) => (
          <Card key={tenant.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><Building2 className="h-6 w-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{tenant.name}</h3>
                    <Badge variant={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'secondary'} size="sm">{tenant.status}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">{tenant.code}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{tenant.city}, {tenant.state}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{tenant.students.toLocaleString('en-IN')} students</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div><p className="text-xs text-slate-500">Plan</p><p className="font-semibold text-slate-900">{tenant.plan} • ₹{tenant.monthlyDemoValue.toLocaleString('en-IN')}/mo demo value</p></div>
                    <Button variant="outline" size="sm" onClick={() => toggleTenantStatus(tenant.id)}>{tenant.status === 'active' ? 'Pause' : 'Activate'}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add demo institution" description="Creates a fictional tenant in local browser storage." footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="tenant-form">Add institution</Button></div>}>
        <form id="tenant-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Institution name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <Input label="Students" type="number" min={0} value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} />
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Plan</label><select value={form.plan} onChange={(e) => { const plan=e.target.value as typeof form.plan; setForm({ ...form, plan, monthlyDemoValue: plan==='Starter'?6000:plan==='Growth'?12000:18000 }) }} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Starter</option><option>Growth</option><option>Campus</option></select></div>
        </form>
      </Modal>
    </div>
  )
}
