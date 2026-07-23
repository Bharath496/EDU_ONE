'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Loader2, Shield, AlertCircle, CheckCircle, ChevronRight, Wrench, Clock, Calendar } from 'lucide-react'

interface MaintenanceInfo {
  isMaintenance: boolean
  message?: string
  startTime?: string
  endTime?: string
  type?: 'scheduled' | 'emergency'
}

export default function MaintenanceCheckPage() {
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const checkMaintenance = async () => {
    setChecking(true)
    try {
      // In real app: fetch from API
      // const res = await fetch('/api/maintenance/status')
      // const data = await res.json()
      // setMaintenance(data)
      
      // Mock: no maintenance
      await new Promise(r => setTimeout(r, 1500))
      setMaintenance({ isMaintenance: false })
    } catch {
      setMaintenance({ isMaintenance: false })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkMaintenance()
    // Check every 5 minutes
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">EduOne</h1>
          <p className="text-primary-300">Checking system status...</p>
          <Loader2 className="w-8 h-8 text-primary-500 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  if (maintenance?.isMaintenance && !dismissed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8">
          <Card className="border-amber-200 shadow-soft">
            <CardHeader>
              <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">System Maintenance</CardTitle>
              <CardDescription className="text-amber-700">
                The system is currently undergoing maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {maintenance.message && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  {maintenance.message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Start</p>
                  <p className="font-semibold text-slate-900">{maintenance.startTime || 'Now'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Estimated End</p>
                  <p className="font-semibold text-slate-900">{maintenance.endTime || 'TBD'}</p>
                </div>
              </div>

              <div className={cn('p-3 rounded-xl text-sm', maintenance.type === 'emergency' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200')}>
                <div className="flex items-center gap-2 mb-1">
                  {maintenance.type === 'emergency' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="font-semibold capitalize">{maintenance.type || 'Scheduled'} Maintenance</span>
                </div>
                <p className="text-slate-600">
                  {maintenance.type === 'emergency'
                    ? 'Urgent maintenance in progress. Some features may be unavailable.'
                    : 'Planned maintenance window. Services will resume shortly.'}
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={() => setDismissed(true)}>
                Continue Anyway (Limited Access)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // No maintenance - redirect to splash or login
  if (!maintenance?.isMaintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-800">All Systems Operational</h1>
          <p className="text-green-700">No maintenance scheduled. Continuing...</p>
          <Loader2 className="w-8 h-8 text-green-500 mx-auto animate-spin" />
          <script dangerouslySetInnerHTML={{ __html: "setTimeout(() => window.location.href = '/auth/language', 1500)" }} />
        </div>
      </div>
    )
  }

  return null
}