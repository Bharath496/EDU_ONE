'use client'

import { useRouter } from 'next/navigation'
import { Building2, CreditCard, IndianRupee, PauseCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function BillingPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const tenants = usePlatformStore((state) => state.tenants)

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const active = tenants.filter((item)=>item.status==='active')
  const illustrativeValue = active.reduce((sum,item)=>sum+item.monthlyDemoValue,0)
  const annualized = illustrativeValue * 12

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div><p className="text-sm font-medium text-primary-600">Platform Admin</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Plans & Billing Demo</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">Illustrative subscription values for portfolio demonstration only. These are not real customers, invoices, or revenue.</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {label:'Active subscriptions',value:active.length,icon:CreditCard},
          {label:'Illustrative monthly value',value:`₹${illustrativeValue.toLocaleString('en-IN')}`,icon:IndianRupee},
          {label:'Illustrative annualized',value:`₹${annualized.toLocaleString('en-IN')}`,icon:Building2},
        ].map((item)=><Card key={item.label}><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6"/></div><div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader><CardTitle>Demo subscription ledger</CardTitle><CardDescription>Plan values are intentionally transparent and fictional.</CardDescription></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm">
          <thead><tr className="border-y border-slate-100 bg-slate-50/80 text-left text-slate-500"><th className="px-4 py-3 font-medium">Institution</th><th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 text-right font-medium">Demo monthly value</th><th className="px-4 py-3 text-right font-medium">Students</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th></tr></thead>
          <tbody>{tenants.map((tenant)=><tr key={tenant.id} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-4 font-semibold text-slate-900">{tenant.name}</td>
            <td className="px-4 py-4"><Badge variant="primary" size="sm">{tenant.plan}</Badge></td>
            <td className="px-4 py-4 text-right font-semibold text-slate-900">₹{tenant.monthlyDemoValue.toLocaleString('en-IN')}</td>
            <td className="px-4 py-4 text-right text-slate-600">{tenant.students.toLocaleString('en-IN')}</td>
            <td className="px-4 py-4"><Badge variant={tenant.status==='active'?'success':tenant.status==='trial'?'warning':'secondary'} size="sm">{tenant.status}</Badge></td>
            <td className="px-4 py-4 text-slate-600">{tenant.joined}</td>
          </tr>)}</tbody>
        </table></div></CardContent>
      </Card>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold"><PauseCircle className="h-4 w-4"/>Production boundary</div>
        <p className="mt-1">No payment gateway is connected. A real deployment would need secure billing-provider integration, webhooks, invoice storage and authorization checks.</p>
      </div>
    </div>
  )
}
