'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, WifiOff, Wifi, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'

export default function InternetCheckPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [checking, setChecking] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const checkConnection = async () => {
    setChecking(true)
    try {
      await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' })
      setIsOnline(true)
    } catch {
      setIsOnline(false)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(c => c + 1)
    checkConnection()
  }

  if (isOnline && !checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-800">Connection Restored</h1>
          <p className="text-green-700">You're back online. Continuing...</p>
          <div className="w-24 h-2 bg-green-100 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-green-500 w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <div className={cn('w-24 h-24 rounded-2xl mx-auto flex items-center justify-center animate-pulse', checking ? 'bg-amber-500' : 'bg-red-500')}>
            {checking ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : (
              <WifiOff className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">No Internet Connection</h1>
          <p className="text-slate-600 text-lg">
            {checking
              ? 'Checking your connection...'
              : 'Please check your internet connection and try again.'}
          </p>
        </div>

        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-center gap-4 text-slate-600">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-6 h-6 text-slate-500" />
              </div>
              <span className="text-sm font-medium">Wi-Fi / Mobile Data</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <ChevronRight className="w-6 h-6 text-slate-500" />
              </div>
              <span className="text-sm font-medium">Router / Modem</span>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <Wifi className="w-6 h-6 text-slate-500" />
              </div>
              <span className="text-sm font-medium">Internet</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">Check each connection point above</p>
        </div>

        <div className="space-y-3">
          {retryCount > 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              Retried {retryCount} time{retryCount > 1 ? 's' : ''}
            </p>
          )}
          <button
            onClick={() => { setRetryCount(c => c + 1); checkConnection() }}
            disabled={checking}
            className="w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? (
              <>Retrying... <Loader2 className="w-5 h-5 ml-2 animate-spin" /></>
            ) : (
              'Retry Connection'
            )}
          </button>
          <button
            onClick={() => window.location.href = '/auth/language'}
            className="w-full px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            Continue Offline (Limited Features)
          </button>
        </div>
      </div>
    </div>
  )
}