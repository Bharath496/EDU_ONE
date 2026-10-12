'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'

const ACCOUNT_BY_ROLE: Record<string, { name: string; email: string; department?: string }> = {
  'Super Admin': { name: 'Platform Admin', email: 'admin@eduone.demo' },
  'College Admin': { name: 'Dr. Rajesh Kumar', email: 'college.admin@eduone.demo' },
  Faculty: { name: 'Prof. Priya Sharma', email: 'faculty@eduone.demo', department: 'AIML' },
  Student: { name: 'Arjun Kumar', email: 'student@eduone.demo', department: 'AIML' },
  Parent: { name: 'Suresh Kumar', email: 'parent@eduone.demo' },
  Staff: { name: 'Divya N', email: 'staff@eduone.demo' },
}

export default function DemoVerificationPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated, isLoading } = useAuthStore()
  const [code, setCode] = useState('')
  const [role, setRole] = useState('')
  const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
      return
    }

    const selectedRole = localStorage.getItem('eduone-demo-role')
    const rawInstitution = localStorage.getItem('eduone-demo-institution')
    if (!selectedRole || !rawInstitution) {
      router.replace('/auth/institution')
      return
    }

    setRole(selectedRole)
    try {
      const value = JSON.parse(rawInstitution)
      setInstitution({ id: value.id, name: value.name })
    } catch {
      router.replace('/auth/institution')
    }
  }, [isAuthenticated, isLoading, router])

  const verify = (event: FormEvent) => {
    event.preventDefault()
    if (code !== '246813') {
      setError('Use the demo verification code shown below.')
      return
    }

    const account = ACCOUNT_BY_ROLE[role]
    if (!account || !institution) return

    const superAdmin = role === 'Super Admin'
    setAuth({
      user: {
        id: role.toLowerCase().replaceAll(' ', '-'),
        email: account.email,
        name: account.name,
        role,
        collegeId: superAdmin ? 'platform' : institution.id,
        collegeName: superAdmin ? 'EDU_ONE Platform Demo' : institution.name,
        department: account.department,
        regNo: role === 'Student' ? '24AI001' : undefined,
        avatar: undefined,
      },
      token: `demo-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    })
    router.push('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="mt-3 text-2xl">Demo verification</CardTitle>
          <CardDescription>
            Step 3 of 3 • {role || 'Selected role'} • no SMS or external identity provider is being faked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={verify} className="space-y-5">
            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary-600">Demo code</p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-primary-950">246813</p>
            </div>

            <Input
              label="Enter 6-digit code"
              value={code}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              leftIcon={<KeyRound className="h-4 w-4 text-slate-400" />}
              placeholder="246813"
              required
            />

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/auth/role')}>Back</Button>
              <Button type="submit" className="flex-1 gap-2">
                Verify & enter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
