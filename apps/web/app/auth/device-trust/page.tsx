'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Loader2,
  Wrench,
  Clock,
  Calendar,
  ChevronLeft,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
} from 'lucide-react'

interface TrustedDevice {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
  location: string
  lastActive: string
  trusted: boolean
  current: boolean
}

const mockDevices: TrustedDevice[] = [
  { id: '1', name: 'iPhone 15 Pro', type: 'mobile', browser: 'Safari', os: 'iOS 17.2', location: 'Coimbatore, IN', lastActive: '2 min ago', trusted: true, current: true },
  { id: '2', name: 'MacBook Pro', type: 'desktop', browser: 'Chrome 120', os: 'macOS 14.2', location: 'Chennai, IN', lastActive: '1 hour ago', trusted: true, current: false },
  { id: '3', name: 'iPad Air', type: 'tablet', browser: 'Safari', os: 'iPadOS 17.2', location: 'Bangalore, IN', lastActive: 'Yesterday', trusted: true, current: false },
  { id: '4', name: 'Windows PC', type: 'desktop', browser: 'Edge 119', os: 'Windows 11', location: 'Mumbai, IN', lastActive: '3 days ago', trusted: false, current: false },
]

export default function DeviceTrustPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<TrustedDevice[]>(mockDevices)
  const [loading, setLoading] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const handleTrust = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, trusted: true } : d))
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    await new Promise(r => setTimeout(r, 1000))
    setDevices(devices.filter(d => d.id !== id))
    setRevokingId(null)
  }

  const handleRevokeAll = async () => {
    if (!confirm('Revoke trust from all other devices? You will need to re-verify on each device.')) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setDevices(devices.map(d => d.current ? d : { ...d, trusted: false }))
    setLoading(false)
  }

  const getDeviceIcon = (type: TrustedDevice['type']) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-6 h-6 text-primary-600" />
      case 'desktop': return <Laptop className="w-6 h-6 text-primary-600" />
      case 'tablet': return <Tablet className="w-6 h-6 text-primary-600" />
    }
  }

  const formatLastActive = (time: string) => time

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Link href="/auth/2fa" className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-primary-600">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Verification</span>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Trusted Devices</h1>
          <p className="text-slate-600 mt-2">Manage which devices can skip 2FA verification</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Devices</CardTitle>
            <CardDescription>Manage trusted devices that can skip 2FA</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {devices.map(device => (
              <div
                key={device.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border hover:border-primary-300 hover:bg-primary-50 transition-colors',
                  device.trusted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900">{device.name}</h3>
                    {device.current && (
                      <Badge variant="primary" className="text-xs">Current</Badge>
                    )}
                    {device.trusted && (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        Trusted
                      </Badge>
                    )}
                    {!device.trusted && (
                      <Badge variant="outline" className="text-xs">Not Trusted</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>{device.browser} on {device.os}</span>
                    <span>{device.location}</span>
                    <span>Last active: {formatLastActive(device.lastActive)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {device.trusted ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(device.id)}
                      disabled={revokingId === device.id}
                      className="text-red-600 hover:bg-red-50"
                    >
                      {revokingId === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Revoke'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrust(device.id)}
                      disabled={loading}
                    >
                      Trust
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {!loading && devices.some(d => d.trusted && !d.current) && (
          <Card className="border-amber-200 mt-4">
            <CardContent className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRevokeAll}
                disabled={loading}
              >
                <AlertCircle className="w-4 h-4 ml-2" />
                Revoke All Other Devices
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                You'll need to re-verify on each device next login
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="w-full"
          >
            <Button className="w-full" size="lg">
              Continue to Dashboard
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link
            href="/auth/2fa"
            className="w-full"
          >
            <Button variant="outline" className="w-full" size="lg">
              Back to Verification
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 text-slate-700 text-sm">
            <Shield className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <div>
              <p className="font-medium">Device Trust Settings</p>
              <p className="text-slate-500 text-xs">Trusted devices skip 2FA for 30 days. After 30 days, re-verification is required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}