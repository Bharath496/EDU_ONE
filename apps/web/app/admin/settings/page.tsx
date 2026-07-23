'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { Settings, ChevronRight, Save, Globe, Shield, Bell, Database, Mail, Clock, Palette, Lock, RefreshCw, Server } from 'lucide-react'

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Settings</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
          </div>
          <Button variant="primary" size="sm" className="gap-2" onClick={handleSave} loading={saving}>
            {saved ? <>Saved <RefreshCw className="w-4 h-4" /></> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'branding', label: 'Branding', icon: Palette },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'regions', label: 'Regions', icon: Globe },
            ].map(item => (
              <button key={item.id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900 transition-colors text-left">
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Platform-wide configuration options</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Platform Name" defaultValue="EduOne" placeholder="Enter platform name" />
                  <Input label="Support Email" defaultValue="support@eduone.io" type="email" placeholder="support@eduone.io" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Default Language" defaultValue="English" placeholder="Default language" />
                  <Input label="Timezone" defaultValue="Asia/Kolkata (UTC+5:30)" placeholder="Default timezone" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>Authentication and access control</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts', enabled: true },
                  { label: 'Session Timeout', desc: 'Automatically log out inactive users after 30 minutes', enabled: true },
                  { label: 'Password Policy', desc: 'Minimum 8 characters, special chars required', enabled: true },
                  { label: 'IP Whitelisting', desc: 'Restrict admin access to approved IP addresses', enabled: false },
                  { label: 'Single Sign-On (SSO)', desc: 'Enable SAML/SSO for enterprise colleges', enabled: false },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{setting.label}</p>
                      <p className="text-sm text-slate-500">{setting.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={setting.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Information</CardTitle>
                <CardDescription>Platform version and status</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {[
                  { label: 'Platform Version', value: 'v3.2.1' },
                  { label: 'Last Deployed', value: '2 days ago' },
                  { label: 'Node Version', value: '24.16.0' },
                  { label: 'Database', value: 'PostgreSQL 16' },
                  { label: 'Storage Used', value: '78% of 500GB' },
                  { label: 'API Endpoint', value: 'https://api.eduone.io/v3' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-medium text-slate-900">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}