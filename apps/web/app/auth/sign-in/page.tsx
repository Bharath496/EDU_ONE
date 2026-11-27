'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { User } from '@/lib/types'

export default function InstitutionalSignInPage() {
  const router = useRouter()
  const setInstitutionalAuth = useAuthStore((state) => state.setInstitutionalAuth)
  const [institutionCode, setInstitutionCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await api.login(institutionCode.trim(), email.trim(), password)
      setInstitutionalAuth(session.user as User, session.access_token)
      router.replace('/dashboard')
    } catch (err: any) {
      const message = err?.response?.data?.detail
      setError(typeof message === 'string' ? message : 'Unable to sign in. Check the API connection and your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white">
        <CardContent className="p-7 sm:p-8">
          <button onClick={() => router.push('/')} className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to EDU_ONE
          </button>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Institutional account</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to EDU_ONE</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use the institution code and account credentials issued by your college administrator.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Institution code</span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input required minLength={2} maxLength={40} value={institutionCode} onChange={(event) => setInstitutionCode(event.target.value)} autoComplete="organization" placeholder="e.g. COLLEGE01" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@college.edu" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input required type="password" maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 text-sm outline-none focus:border-indigo-400" />
              </div>
            </label>

            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full bg-white text-slate-950 hover:bg-slate-100">
              {submitting ? 'Signing in...' : 'Sign in securely'}
            </Button>
          </form>

          <p className="mt-5 text-xs leading-5 text-slate-500">Demo role access remains available separately from the home page. Institutional sign-in requires a configured API and provisioned account.</p>
        </CardContent>
      </Card>
    </main>
  )
}
