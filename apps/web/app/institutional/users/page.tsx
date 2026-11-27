'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

const roles = ['Student', 'Parent', 'Faculty', 'HOD', 'Class Advisor', 'Principal', 'Vice Principal', 'Exam Cell', 'Accounts', 'Librarian', 'Placement Officer', 'HR', 'Admissions', 'Hostel Warden', 'Transport Coordinator', 'Support Staff']

export default function InstitutionalUsersPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Student')
  const [departmentId, setDepartmentId] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [programme, setProgramme] = useState('')
  const [semester, setSemester] = useState('1')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.getInstitutionalUsers({ limit: 200 })
      setUsers(response.items || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load user accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (user.role !== 'College Admin') { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await api.createInstitutionalUser({
        email, full_name: fullName, password, roles: [role],
        ...(role === 'HOD' && departmentId ? { department_id: departmentId } : {}),
      })
      if (role === 'Student') {
        await api.createInstitutionalStudentProfile({
          user_id: created.id, registration_number: registrationNumber,
          department_id: departmentId || undefined, programme: programme || undefined,
          semester: Number(semester),
        })
      }
      setSuccess(role === 'Student' ? 'Student account and profile created.' : 'User account created.')
      setEmail(''); setFullName(''); setPassword(''); setDepartmentId('')
      setRegistrationNumber(''); setProgramme(''); setSemester('1')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Account creation failed. If the user was created but the student profile failed, check the account list before retrying.')
      await load()
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (item: any) => {
    setError('')
    setSuccess('')
    try {
      await api.updateInstitutionalUserStatus(item.id, item.is_locked ? { is_active: item.is_active, is_locked: false } : { is_active: !item.is_active, is_locked: false })
      setSuccess('Account status updated.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update account status.')
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading user administration...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">User administration</h1><p className="text-sm text-slate-500">{user?.collegeName}</p></div>
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-slate-500" /><span className="text-sm text-slate-600">{users.length} accounts</span></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[380px_1fr]">
        <Card><CardContent className="p-5">
          <div className="mb-5 flex items-center gap-2 font-semibold text-slate-950"><UserPlus className="h-4 w-4" /> Create account</div>
          <form onSubmit={createUser} className="space-y-3">
            <label className="block text-sm">Full name<input required minLength={2} value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Initial password<input required minLength={12} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /><span className="mt-1 block text-xs text-slate-500">At least 12 characters. Share it securely.</span></label>
            <label className="block text-sm">Role<select value={role} onChange={e => setRole(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3">{roles.map(item => <option key={item}>{item}</option>)}</select></label>
            {(role === 'Student' || role === 'HOD') && <label className="block text-sm">Department ID<input value={departmentId} onChange={e => setDepartmentId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>}
            {role === 'Student' && <>
              <label className="block text-sm">Registration number<input required value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
              <label className="block text-sm">Programme<input value={programme} onChange={e => setProgramme(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
              <label className="block text-sm">Semester<input required type="number" min="1" max="12" value={semester} onChange={e => setSemester(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            </>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {success && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'Creating...' : 'Create account'}</Button>
          </form>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h2 className="font-semibold text-slate-950">Institution accounts</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="py-3 pr-3">Name / email</th><th className="py-3 pr-3">Role</th><th className="py-3 pr-3">Status</th><th className="py-3">Action</th></tr></thead>
              <tbody>{users.map(item => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 pr-3"><p className="font-medium text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.email}</p></td><td className="py-3 pr-3">{item.roles.map((r: any) => r.role).join(', ')}</td><td className="py-3 pr-3">{item.is_locked ? 'Locked' : item.is_active ? 'Active' : 'Inactive'}</td><td className="py-3"><button disabled={item.id === user?.id} onClick={() => void toggleStatus(item)} className="text-xs font-semibold text-indigo-600 disabled:text-slate-300">{item.is_locked ? 'Unlock' : item.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody>
            </table>
            {users.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No user accounts found.</p>}
          </div>
        </CardContent></Card>
      </div>
    </main>
  )
}
