'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Loader2, AlertCircle, CheckCircle, ArrowRight, Download, AlertTriangle, Info } from 'lucide-react'

interface VersionInfo {
  currentVersion: string
  latestVersion: string
  isLatest: boolean
  isCritical: boolean
  releaseNotes?: string
  downloadUrl?: string
  minSupportedVersion?: string
}

export default function VersionCheckPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const currentVersion = '2.1.0'
  const minSupportedVersion = '1.5.0'

  const checkVersion = async () => {
    setChecking(true)
    try {
      // In real app: fetch from API
      // const res = await fetch('/api/version/check')
      // const data = await res.json()
      
      // Mock response
      await new Promise(r => setTimeout(r, 1200))
      const isLatest = currentVersion === '2.1.0'
      setVersionInfo({
        currentVersion,
        latestVersion: '2.1.0',
        isLatest,
        isCritical: false,
        releaseNotes: '• Improved attendance sync performance\n• Fixed grade calculation edge cases\n• Enhanced mobile responsiveness\n• Security patches',
        minSupportedVersion,
      })
    } catch {
      setVersionInfo({
        currentVersion,
        latestVersion: currentVersion,
        isLatest: true,
        isCritical: false,
        minSupportedVersion,
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkVersion()
  }, [])

  const handleUpdate = async () => {
    if (!versionInfo?.downloadUrl) return
    setDownloading(true)
    // In real app: window.location.href = versionInfo.downloadUrl
    await new Promise(r => setTimeout(r, 2000))
    setDownloading(false)
    checkVersion()
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">EduOne</h1>
          <p className="text-primary-300">Checking for updates...</p>
          <Loader2 className="w-8 h-8 text-primary-500 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  const needsCriticalUpdate = versionInfo?.isCritical && !versionInfo?.isLatest
  const needsOptionalUpdate = !versionInfo?.isLatest && !versionInfo?.isCritical
  const isCurrentVersionSupported = versionInfo ? compareVersions(versionInfo.currentVersion, versionInfo.minSupportedVersion!) >= 0 : true

  function compareVersions(v1: string, v2: string): number {
    const a = v1.split('.').map(Number)
    const b = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const n1 = a[i] || 0
      const n2 = b[i] || 0
      if (n1 !== n2) return n1 - n2
    }
    return 0
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">EduOne</h1>
          <p className="text-primary-300">Checking for updates...</p>
          <Loader2 className="w-8 h-8 text-primary-500 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  // Version not supported - force update
  if (!isCurrentVersionSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-soft">
          <CardHeader>
            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Version No Longer Supported</CardTitle>
            <CardDescription className="text-red-700">
              Your app version is too old to connect to our servers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              <p className="font-semibold mb-1">Unsupported Version</p>
              <p>Current: {versionInfo?.currentVersion} • Minimum: {versionInfo?.minSupportedVersion}</p>
            </div>
            <p className="text-slate-600 text-sm">
              Please update to the latest version to continue using EduOne. 
              Older versions lack critical security patches and API compatibility.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleUpdate}
              disabled={downloading}
            >
              {downloading ? (
                <>Downloading... <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
              ) : (
                <>
                  <Download className="w-5 h-5 ml-2" />
                  Update Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Critical update required
  if (needsCriticalUpdate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-soft">
          <CardHeader>
            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Critical Update Required</CardTitle>
            <CardDescription className="text-red-700">
              A critical security update is required to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              <p className="font-semibold mb-1">Security Update Required</p>
              <p>Version {versionInfo?.latestVersion} contains critical security fixes.</p>
            </div>
            {versionInfo?.releaseNotes && (
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
                <p className="font-semibold mb-2">What's New:</p>
                <pre className="whitespace-pre-wrap">{versionInfo.releaseNotes}</pre>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleUpdate}
              disabled={downloading}
            >
              {downloading ? (
                <>Downloading... <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
              ) : (
                <>
                  <Download className="w-5 h-5 ml-2" />
                  Install Critical Update
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Optional update available
  if (needsOptionalUpdate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200 shadow-soft">
          <CardHeader>
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Update Available</CardTitle>
            <CardDescription className="text-amber-700">
              Version {versionInfo?.latestVersion} is now available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {versionInfo?.releaseNotes && (
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700">
                <p className="font-semibold mb-2">What's New:</p>
                <pre className="whitespace-pre-wrap">{versionInfo.releaseNotes}</pre>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                size="lg"
                onClick={handleUpdate}
                disabled={downloading}
              >
                {downloading ? (
                  <>Downloading... <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
                ) : (
                  <>
                    <Download className="w-5 h-5 ml-2" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => window.location.href = '/auth/language'}
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Up to date - redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-green-800">You're Up to Date</h1>
        <p className="text-green-700">Version {versionInfo?.currentVersion} • All systems go</p>
        <Loader2 className="w-8 h-8 text-green-500 mx-auto animate-spin" />
        <script dangerouslySetInnerHTML={{ __html: "setTimeout(() => window.location.href = '/auth/language', 1500)" }} />
      </div>
    </div>
  )
}