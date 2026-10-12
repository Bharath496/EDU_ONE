'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { usePlatformStore } from '@/lib/platform-store'

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const tenants = usePlatformStore((state)=>state.tenants)
  const users = usePlatformStore((state)=>state.users)
  const resetPlatformDemo = usePlatformStore((state)=>state.resetPlatformDemo)
  const [platformName,setPlatformName]=useState('EDU_ONE Platform Demo')
  const [supportEmail,setSupportEmail]=useState('support@eduone.demo')
  const [saved,setSaved]=useState(false)

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const save=()=>{
    localStorage.setItem('eduone-platform-settings',JSON.stringify({platformName,supportEmail}))
    setSaved(true)
    window.setTimeout(()=>setSaved(false),2200)
  }

  const reset=()=>{
    if(window.confirm('Reset fictional platform tenants and users to the default demo data?')) resetPlatformDemo()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <div><p className="text-sm font-medium text-primary-600">Platform Admin</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Platform Settings</h1><p className="mt-1 text-sm text-slate-500">Safe local settings for the portfolio admin demo.</p></div>

      {saved&&<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Platform demo settings saved locally.</div>}

      <Card>
        <CardHeader><CardTitle>General</CardTitle><CardDescription>These values stay in this browser and do not change any external service.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input label="Platform name" value={platformName} onChange={(e)=>setPlatformName(e.target.value)}/>
          <Input label="Support email" type="email" value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)}/>
          <div className="md:col-span-2"><Button onClick={save} className="gap-2"><Save className="h-4 w-4"/>{saved?'Saved':'Save settings'}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600"/>Demo integrity</CardTitle><CardDescription>Current local platform state.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Institutions</p><p className="text-2xl font-bold text-slate-950">{tenants.length}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Platform users</p><p className="text-2xl font-bold text-slate-950">{users.length}</p></div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-800">Reset platform demo</CardTitle><CardDescription>Restore the original fictional tenant and user records.</CardDescription></CardHeader>
        <CardContent><Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={reset}><RefreshCcw className="h-4 w-4"/>Reset platform data</Button></CardContent>
      </Card>
    </div>
  )
}
