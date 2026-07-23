'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { Badge } from '@/components/ui/Badge'
import {
  User, Settings, ChevronRight, Save, Bell, Shield, Palette, Globe, LogOut, Mail, Phone, Key, RefreshCw, Moon, Sun, Monitor
} from 'lucide-react'

export default function UserSettingsPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }, 1000)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { clearAuth(); router.push('/login') }}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
            <Button variant="primary" size="sm" className="gap-2" onClick={handleSave} loading={saving}>
              {saved ? <><RefreshCw className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-white border border-slate-200">
          <Avatar name={user.name} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email} • {user.role}</p>
            <p className="text-sm text-slate-400">{user.collegeName}{user.department ? ` • ${user.department}` : ''}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user.name} />
                <Input label="Email" defaultValue={user.email} type="email" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Phone" type="tel" placeholder="+91 9876543210" />
                <Input label="Department" defaultValue={user.department || ''} />
              </div>
              <Input label="Address" placeholder="Enter your address" />
            </CardContent>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive alerts and updates</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive updates via email', enabled: true },
                { label: 'Push Notifications', desc: 'Get browser push notifications', enabled: true },
                { label: 'SMS Alerts', desc: 'Receive important alerts via SMS', enabled: false },
                { label: 'Attendance Reminders', desc: 'Daily attendance summary', enabled: true },
                { label: 'Fee Reminders', desc: 'Payment due reminders', enabled: true },
                { label: 'Announcements', desc: 'College announcements and notices', enabled: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Theme</CardTitle>
                <CardDescription>Choose your preferred appearance</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean light theme' },
                    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Dark mode' },
                    { id: 'system', label: 'System', icon: Monitor, desc: 'Follow system' },
                  ].map(theme => (
                    <button key={theme.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors text-center">
                      <theme.icon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-medium text-slate-900">{theme.label}</p>
                      <p className="text-xs text-slate-500">{theme.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Language & Region</CardTitle>
                <CardDescription>Set your language and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                      <option>Asia/Kolkata (UTC+5:30)</option>
                      <option>Asia/Dubai (UTC+4:00)</option>
                      <option>America/New_York (UTC-5:00)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="New Password" type="password" placeholder="Enter new password" />
                  <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                </div>
                <Button variant="primary" size="sm">Update Password</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">2FA Status</p>
                    <p className="text-sm text-slate-500">Two-factor authentication is currently disabled</p>
                  </div>
                  <Button variant="primary" size="sm">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Sessions</CardTitle>
                <CardDescription>Devices where you are currently logged in</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {[
                  { device: 'Chrome on Windows', ip: '192.168.1.100', lastActive: 'Now', current: true },
                  { device: 'Safari on iPhone', ip: '192.168.1.101', lastActive: '2 hours ago', current: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.current ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{s.device}</p>
                        <p className="text-xs text-slate-500">IP: {s.ip} • {s.lastActive}</p>
                      </div>
                    </div>
                    {s.current && <Badge variant="success" size="sm">Current</Badge>}
                    {!s.current && <Button variant="ghost" size="sm" className="text-red-600 text-xs">Revoke</Button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}