'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'

const ROLES = [
  { role: 'College Admin', icon: Building2, description: 'Institution management and academic operations' },
  { role: 'Faculty', icon: UserCheck, description: 'Teaching, attendance, assignments and marks' },
  { role: 'Student', icon: GraduationCap, description: 'Learning, coursework, fees and self-service' },
  { role: 'Parent', icon: Users, description: 'Student progress, fees and alerts' },
  { role: 'Staff', icon: Wrench, description: 'Operations, library, support and fee desk' },
  { role: 'Super Admin', icon: ShieldCheck, description: 'Platform tenant, user and permission administration' },
]

export default function RolePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [institutionName, setInstitutionName] = useState('')
  const [selected, setSelected] = useState('Student')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
      return
    }
    const raw = localStorage.getItem('eduone-demo-institution')
    if (!raw) {
      router.replace('/auth/institution')
      return
    }
    try {
      const institution = JSON.parse(raw)
      setInstitutionName(institution?.name ?? 'EDU_ONE Demo Institution')
    } catch {
      router.replace('/auth/institution')
    }
  }, [isAuthenticated, isLoading, router])

  const continueFlow = () => {
    localStorage.setItem('eduone-demo-role', selected)
    router.push('/auth/2fa')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Guided demo • Step 2 of 3</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Choose your role</h1>
          <p className="mt-2 text-sm text-slate-500">{institutionName || 'Selected institution'} • role-based access demo</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((item) => {
            const active = selected === item.role
            return (
              <button key={item.role} onClick={() => setSelected(item.role)} className="text-left">
                <Card className={active ? 'border-primary-300 bg-primary-50' : ''}>
                  <CardContent className="p-5">
                    <div className={`inline-flex rounded-2xl p-3 ${active ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <p className="mt-4 font-semibold text-slate-950">{item.role}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push('/auth/institution')}>Back</Button>
          <Button onClick={continueFlow} className="gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  )
}
