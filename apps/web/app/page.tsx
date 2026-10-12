'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  Library,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'

const DEMO_ROLES = [
  {
    role: 'Super Admin',
    name: 'Platform Admin',
    email: 'admin@eduone.demo',
    icon: ShieldCheck,
    description: 'Platform overview and administrative controls',
  },
  {
    role: 'College Admin',
    name: 'Dr. Rajesh Kumar',
    email: 'college.admin@eduone.demo',
    icon: Users,
    description: 'Students, faculty, fees, reports and institution operations',
  },
  {
    role: 'Faculty',
    name: 'Prof. Priya Sharma',
    email: 'faculty@eduone.demo',
    icon: UserCheck,
    description: 'Classes, attendance, assignments, marks and exams',
  },
  {
    role: 'Student',
    name: 'Arjun Kumar',
    email: 'student@eduone.demo',
    icon: GraduationCap,
    description: 'Academic overview, attendance, assignments and notices',
  },
  {
    role: 'Parent',
    name: 'Suresh Kumar',
    email: 'parent@eduone.demo',
    icon: Users,
    description: 'Student progress, attendance, fees and alerts',
  },
  {
    role: 'Staff',
    name: 'Divya N',
    email: 'staff@eduone.demo',
    icon: Users,
    description: 'Operations, library, fee desk and student support',
  },
]

const FEATURES = [
  { icon: GraduationCap, title: 'Student records', description: 'Persistent CRUD, filters and export' },
  { icon: CalendarCheck, title: 'Attendance', description: 'Session marking with live recalculation' },
  { icon: BookOpen, title: 'Academics', description: 'Classes, assignments, marks and exams' },
  { icon: IndianRupee, title: 'Fee management', description: 'Ledger, dues and payment simulation' },
  { icon: Library, title: 'Library', description: 'Catalog inventory and issue workflow' },
  { icon: Megaphone, title: 'Communication', description: 'Notices, priorities and live alerts' },
  { icon: BarChart3, title: 'Reports', description: 'Real CSV exports from current data' },
  { icon: Sparkles, title: 'Student intelligence', description: 'Explainable academic-risk monitoring' },
]

export default function HomePage() {
  const router = useRouter()
  const { setAuth, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const enterDemo = (account: (typeof DEMO_ROLES)[number]) => {
    const session = {
      user: {
        id: account.role.toLowerCase().replaceAll(' ', '-'),
        email: account.email,
        name: account.name,
        role: account.role,
        collegeId: account.role === 'Super Admin' ? 'platform' : 'eduone-demo',
        collegeName: account.role === 'Super Admin' ? 'EDU_ONE Platform Demo' : 'EDU_ONE Demo Institution',
        department: account.role === 'Faculty' || account.role === 'Student' ? 'AIML' : undefined,
        avatar: undefined,
      },
      token: `demo-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }
    setAuth(session)
    router.push('/dashboard')
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-white">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold">E</div>
          <p className="mt-3 text-sm text-slate-400">Loading EDU_ONE...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.32),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Portfolio-grade college operating system
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                One connected workspace for the core life of a college.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 lg:text-lg">
                EDU_ONE is an interactive multi-role demo built with Next.js, TypeScript and FastAPI.
                The core workflows share one persisted local data layer, so actions actually affect the rest of the app.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-300">
                {['₹0 required service cost', 'Local-first demo data', 'Role-based navigation', 'Automated CI checks'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Core modules</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <feature.icon className="h-5 w-5 text-indigo-300" />
                    <p className="mt-2 text-sm font-semibold">{feature.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-6">
          <p className="text-sm font-semibold text-indigo-300">Demo access</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Choose a role and enter the app</h2>
          <p className="mt-2 text-sm text-slate-400">
            This is deliberately demo authentication. No fake SSO buttons, no pretend production security theater.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {DEMO_ROLES.map((account) => (
            <Card key={account.role} className="border-slate-800 bg-slate-900/80 text-white">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                  <account.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{account.role}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{account.description}</p>
                <Button
                  onClick={() => enterDemo(account)}
                  className="mt-5 w-full gap-2 bg-white text-slate-950 hover:bg-slate-100"
                  size="sm"
                >
                  Enter demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
