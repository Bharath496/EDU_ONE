'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Building2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const tenants = usePlatformStore((state)=>state.tenants)
  const users = usePlatformStore((state)=>state.users)

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const totalStudents = tenants.reduce((sum,item)=>sum+item.students,0)
  const activeRate = tenants.length ? Math.round((tenants.filter((item)=>item.status==='active').length/tenants.length)*100) : 0
  const avgStudents = tenants.length ? Math.round(totalStudents/tenants.length) : 0

  const byState = Array.from(new Set(tenants.map((item)=>item.state))).map((state)=>{
    const rows=tenants.filter((item)=>item.state===state)
    return {state,count:rows.length,students:rows.reduce((sum,item)=>sum+item.students,0)}
  }).sort((a,b)=>b.students-a.students)

  const byRole = ['College Admin','Faculty','Student','Parent'].map((role)=>({
    role,
    count:users.filter((item)=>item.role===role).length,
  }))

  const byPlan = ['Starter','Growth','Campus'].map((plan)=>({
    plan,
    count:tenants.filter((item)=>item.plan===plan).length,
  }))

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div><p className="text-sm font-medium text-primary-600">Platform Admin</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Platform Analytics</h1><p className="mt-1 text-sm text-slate-500">Analytics calculated from the fictional tenant and user records in this browser.</p></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {label:'Institutions',value:tenants.length,icon:Building2},
          {label:'Demo users',value:users.length,icon:Users},
          {label:'Students represented',value:totalStudents.toLocaleString('en-IN'),icon:GraduationCap},
          {label:'Active tenant rate',value:`${activeRate}%`,icon:ShieldCheck},
        ].map((item)=><Card key={item.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6"/></div><div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600"/>State distribution</CardTitle><CardDescription>Demo institutions and student metadata.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {byState.map((row)=><div key={row.state}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-800">{row.state}</span><span className="text-slate-500">{row.count} institution{row.count===1?'':'s'}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary-500" style={{width:`${Math.max(8,Math.round((row.students/Math.max(totalStudents,1))*100))}%`}}/></div>
              <p className="mt-1 text-xs text-slate-400">{row.students.toLocaleString('en-IN')} students represented</p>
            </div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary-600"/>Role distribution</CardTitle><CardDescription>Current platform-demo users.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {byRole.map((row)=><div key={row.role} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span className="text-sm font-medium text-slate-800">{row.role}</span><span className="text-lg font-bold text-slate-950">{row.count}</span></div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary-600"/>Plan mix</CardTitle><CardDescription>Illustrative plan selection only.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {byPlan.map((row)=><div key={row.plan} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><span className="text-sm font-medium text-slate-800">{row.plan}</span><span className="text-lg font-bold text-slate-950">{row.count}</span></div>)}
            <div className="rounded-xl bg-primary-50 p-4"><p className="text-xs text-primary-700">Average students per tenant</p><p className="mt-1 text-2xl font-bold text-primary-950">{avgStudents.toLocaleString('en-IN')}</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
