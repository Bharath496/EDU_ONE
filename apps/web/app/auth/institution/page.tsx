'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'

const INSTITUTIONS = [
  { id: 'eduone-demo', name: 'EDU_ONE Demo Institution', city: 'Coimbatore', state: 'Tamil Nadu', code: 'EDUDEMO' },
  { id: 'northstar', name: 'Northstar Institute of Technology', city: 'Bengaluru', state: 'Karnataka', code: 'NIT-DEMO' },
  { id: 'riverbend', name: 'Riverbend Arts & Science College', city: 'Chennai', state: 'Tamil Nadu', code: 'RASC-DEMO' },
  { id: 'horizon', name: 'Horizon Engineering College', city: 'Kochi', state: 'Kerala', code: 'HEC-DEMO' },
]

export default function InstitutionPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [selected, setSelected] = useState('eduone-demo')

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard')
    const raw = localStorage.getItem('eduone-demo-institution')
    if (raw) {
      try {
        const value = JSON.parse(raw)
        if (value?.id) setSelected(value.id)
      } catch {}
    }
  }, [isAuthenticated, isLoading, router])

  const continueFlow = () => {
    const institution = INSTITUTIONS.find((item) => item.id === selected) ?? INSTITUTIONS[0]
    localStorage.setItem('eduone-demo-institution', JSON.stringify(institution))
    router.push('/auth/role')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Guided demo • Step 1 of 3</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Select an institution</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            These are fictional demo tenants used only to demonstrate institution-aware navigation.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {INSTITUTIONS.map((institution) => {
            const active = selected === institution.id
            return (
              <button key={institution.id} onClick={() => setSelected(institution.id)} className="text-left">
                <Card className={active ? 'border-primary-400 bg-primary-50' : 'border-slate-800 bg-slate-900 text-white'}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`rounded-2xl p-3 ${active ? 'bg-primary-100 text-primary-700' : 'bg-white/10 text-indigo-300'}`}>
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold ${active ? 'text-slate-950' : 'text-white'}`}>{institution.name}</p>
                          <p className={`mt-1 text-sm ${active ? 'text-slate-600' : 'text-slate-400'}`}>{institution.city}, {institution.state}</p>
                          <p className={`mt-2 font-mono text-xs ${active ? 'text-primary-700' : 'text-indigo-300'}`}>{institution.code}</p>
                        </div>
                        {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => router.push('/')} className="border-white/15 bg-white/5 text-white hover:bg-white/10">Back</Button>
          <Button onClick={continueFlow} className="gap-2 bg-white text-slate-950 hover:bg-slate-100">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  )
}
