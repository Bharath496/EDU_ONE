'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  Building2,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const activity = useEduStore((state) => state.activity)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setUser({
      ...user,
      name: name.trim() || user.name,
      department: department.trim() || undefined,
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <p className="text-sm font-medium text-primary-600">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your demo identity and workspace context.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar name={user.name} size="xl" />
            <h2 className="mt-4 text-xl font-bold text-slate-950">{user.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-3 flex justify-center"><Badge variant="primary">{user.role}</Badge></div>

            <div className="mt-6 space-y-3 text-left text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Building2 className="h-4 w-4 text-primary-600" />
                <div>
                  <p className="text-xs text-slate-500">Institution</p>
                  <p className="font-medium text-slate-900">{user.collegeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-500">Session</p>
                  <p className="font-medium text-slate-900">Local portfolio demo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>Updates persist in the current demo session.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} />
                <Input label="Email" value={user.email} disabled leftIcon={<Mail className="h-4 w-4 text-slate-400" />} />
                <Input label="Role" value={user.role} disabled leftIcon={<User className="h-4 w-4 text-slate-400" />} />
                <Input label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. AIML" />
                <div className="md:col-span-2">
                  <Button type="submit" className="gap-2"><Save className="h-4 w-4" />{saved ? 'Saved' : 'Save profile'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-5"><GraduationCap className="h-5 w-5 text-blue-600" /><p className="mt-3 text-2xl font-bold text-slate-950">{students.length}</p><p className="text-sm text-slate-500">student records</p></CardContent></Card>
            <Card><CardContent className="p-5"><Activity className="h-5 w-5 text-violet-600" /><p className="mt-3 text-2xl font-bold text-slate-950">{activity.length}</p><p className="text-sm text-slate-500">workspace actions</p></CardContent></Card>
            <Card><CardContent className="p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-2xl font-bold text-slate-950">₹0</p><p className="text-sm text-slate-500">required service cost</p></CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  )
}
