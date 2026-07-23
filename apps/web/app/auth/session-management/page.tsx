'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { ChevronRight, ArrowLeft, Shield, Clock, AlertCircle, CheckCircle, LogOut, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

export default function SessionManagementPage() {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [sessions, setSessions] = useState<Array<{
    id: string
    device: string
    browser: string
    os: string
    location: string
    lastActive: string
    current: boolean
    expiresAt: string
  }>>([
    { id: '1', device: 'iPhone 15 Pro', browser: 'Safari', os: 'iOS 17.2', location: 'Coimbatore, IN', lastActive: 'Now', current: true, expiresAt: '30 days' },
    { id: '2', device: 'MacBook Pro', browser: 'Chrome 120', os: 'macOS 14.2', location: 'Chennai, IN', lastActive: '1 hour ago', current: false, expiresAt: '15 days' },
    { id: '3', device: 'iPad Air', browser: 'Safari', os: 'iPadOS 17.2', location: 'Bangalore, IN', lastActive: 'Yesterday', current: false, expiresAt: '10 days' },
    { id: '4', device: 'Windows PC', browser: 'Edge 119', os: 'Windows 11', location: 'Mumbai, IN', lastActive: '3 days ago', current: false, expiresAt: '5 days' },
  ])
  const [loading, setLoading] = useState(false)

  const handleRevoke = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id))
  }

  const handleLogoutAll = () => {
    clearAuth()
    router.push('/login')
  }

  const handleExtend = (id: string) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, expiresAt: '30 days' } : s))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-primary-600">
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Session Management</h1>
          <p className="text-slate-600 mt-2">Manage your active sessions and security settings</p>
        </div>

        <Card className="shadow-soft mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Sessions</CardTitle>
            <CardDescription>View and manage all your active login sessions</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {sessions.map(session => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border hover:border-primary-300 hover:bg-primary-50 transition-colors',
                  session.current ? 'bg-primary-50 border-primary-200' : 'border-slate-200'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900">{session.device}</h3>
                    {session.current && <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">Current</span>}
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      Active
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{session.browser} on {session.os}</span>
                    <span>{session.location}</span>
                    <span>Last active: {session.lastActive}</span>
                    <span className="text-slate-400">Expires: {session.expiresAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary-600 hover:bg-primary-50"
                  >
                    Extend
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-200 mb-4">
          <CardContent className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { clearAuth(); router.push('/login'); }}
            >
              Log Out of All Sessions
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
              You'll need to log in again on all devices
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Link href="/dashboard">
            <Button className="w-full" size="lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 text-slate-700 text-sm">
              <Shield className="w-5 h-5 text-primary-600 flex-shrink-0" />
              <div>
                <p className="font-medium">Session Security</p>
                <p className="text-slate-500 text-xs">Sessions expire after 30 days of inactivity. You can revoke any session at any time.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}