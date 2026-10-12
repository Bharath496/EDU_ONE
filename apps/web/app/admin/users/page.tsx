'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Plus, Search, Shield, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const users = usePlatformStore((state) => state.users)
  const tenants = usePlatformStore((state) => state.tenants)
  const addUser = usePlatformStore((state) => state.addUser)
  const toggleUserStatus = usePlatformStore((state) => state.toggleUserStatus)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'College Admin' as 'College Admin' | 'Faculty' | 'Student' | 'Parent',
    tenantId: tenants[0]?.id ?? 'tenant-1',
    status: 'active' as 'active' | 'inactive',
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return users.filter((item) => {
      const matchesSearch = !needle || item.name.toLowerCase().includes(needle) || item.email.toLowerCase().includes(needle)
      const matchesRole = role === 'All' || item.role === role
      return matchesSearch && matchesRole
    })
  }, [role, search, users])

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    addUser({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() })
    setOpen(false)
    setForm({ ...form, name: '', email: '' })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-medium text-primary-600">Platform Admin</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Platform Users</h1><p className="mt-1 text-sm text-slate-500">Manage demo users across fictional tenant institutions.</p></div>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add user</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label:'Total users', value:users.length, icon:Users },
          { label:'Active', value:users.filter((item)=>item.status==='active').length, icon:Shield },
          { label:'Institutions', value:new Set(users.map((item)=>item.tenantId)).size, icon:Users },
        ].map((item)=>(
          <Card key={item.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6"/></div><div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px]">
        <Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name or email" leftIcon={<Search className="h-4 w-4 text-slate-400"/>}/>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>All</option><option>College Admin</option><option>Faculty</option><option>Student</option><option>Parent</option></select>
      </CardContent></Card>

      <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
        <thead><tr className="border-b border-slate-100 bg-slate-50/80 text-left text-slate-500"><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Institution</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Action</th></tr></thead>
        <tbody>{filtered.map((item)=>{const tenant=tenants.find((t)=>t.id===item.tenantId);return <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
          <td className="px-4 py-4"><div className="flex items-center gap-3"><Avatar name={item.name} size="sm"/><div><p className="font-semibold text-slate-900">{item.name}</p><p className="flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3"/>{item.email}</p></div></div></td>
          <td className="px-4 py-4"><Badge variant="primary" size="sm">{item.role}</Badge></td>
          <td className="px-4 py-4 text-slate-600">{tenant?.name ?? 'Unknown tenant'}</td>
          <td className="px-4 py-4 text-slate-600">{item.joined}</td>
          <td className="px-4 py-4"><Badge variant={item.status==='active'?'success':'secondary'} size="sm">{item.status}</Badge></td>
          <td className="px-4 py-4 text-right"><Button variant="outline" size="sm" onClick={()=>toggleUserStatus(item.id)}>{item.status==='active'?'Deactivate':'Activate'}</Button></td>
        </tr>})}</tbody>
      </table></div></CardContent></Card>

      <Modal open={open} onClose={()=>setOpen(false)} title="Add platform user" description="Creates a fictional user in local browser storage." footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" form="platform-user-form">Add user</Button></div>}>
        <form id="platform-user-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required/>
          <Input label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required/>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label><select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as typeof form.role})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>College Admin</option><option>Faculty</option><option>Student</option><option>Parent</option></select></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Institution</label><select value={form.tenantId} onChange={(e)=>setForm({...form,tenantId:e.target.value})} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{tenants.map((tenant)=><option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></div>
        </form>
      </Modal>
    </div>
  )
}
