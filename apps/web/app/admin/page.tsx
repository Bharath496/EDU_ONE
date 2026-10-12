'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const tenants = usePlatformStore((state) => state.tenants)
  const users = usePlatformStore((state) => state.users)

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-pulse rounded-2xl bg-primary-600" /></div>
  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const activeTenants = tenants.filter((item) => item.status === 'active').length
  const activeUsers = users.filter((item) => item.status === 'active').length
  const demoValue = tenants
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => sum + item.monthlyDemoValue, 0)
  const students = tenants.reduce((sum, item) => sum + item.students, 0)

  const stats = [
    { label: 'Demo institutions', value: tenants.length, note: `${activeTenants} active`, icon: Building2 },
    { label: 'Platform users', value: users.length, note: `${activeUsers} active`, icon: Users },
    { label: 'Students represented', value: students.toLocaleString('en-IN'), note: 'demo tenant metadata', icon: UserCheck },
    { label: 'Demo plan value', value: `₹${demoValue.toLocaleString('en-IN')}`, note: 'illustrative monthly value', icon: CreditCard },
  ]

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.15em]">Super Admin</span></div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Platform Demo Console</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage fictional demo tenants and users without pretending EDU_ONE already has thousands of customers. A radical concept: portfolio numbers that admit they are portfolio numbers.
            </p>
          </div>
          <Badge variant="success">Local persistent demo</Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p><p className="text-xs text-slate-400">{item.note}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Institutions</CardTitle>
            <CardDescription>Current fictional tenant set used to demonstrate platform administration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{tenant.name}</p>
                  <p className="text-xs text-slate-500">{tenant.city}, {tenant.state} • {tenant.plan}</p>
                </div>
                <Badge variant={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'secondary'} size="sm">{tenant.status}</Badge>
              </div>
            ))}
            <Link href="/admin/colleges" className="inline-flex text-sm font-semibold text-primary-700 hover:text-primary-800">Manage institutions →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin tools</CardTitle>
            <CardDescription>Functional platform-demo views.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { href: '/admin/users', icon: Users, title: 'Users', desc: 'Add and activate platform users' },
              { href: '/admin/billing', icon: CreditCard, title: 'Plans', desc: 'Inspect demo subscription values' },
              { href: '/admin/analytics', icon: BarChart3, title: 'Analytics', desc: 'Tenant and role distribution' },
              { href: '/admin/settings', icon: Activity, title: 'Platform settings', desc: 'Reset the platform demo store' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-primary-300 hover:bg-primary-50/40">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-700"><item.icon className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
