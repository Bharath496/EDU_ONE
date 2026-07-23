'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, ChevronRight, Shield, AlertCircle, Loader2, Mail, Smartphone } from 'lucide-react'

function TwoFAPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'student'
  const institution = searchParams.get('institution') || 'psg-tech'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [method, setMethod] = useState<'email' | 'sms' | 'authenticator'>('email')
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const roleLabels: Record<string, string> = {
    student: 'Student',
    faculty: 'Faculty',
    parent: 'Parent',
    staff: 'Staff',
  }

  const institutionNames: Record<string, string> = {
    'psg-arts': 'PSG College of Arts and Science',
    'psg-tech': 'PSG College of Technology',
    'kct': 'Kumaraguru College of Technology',
    'skasc': 'Sri Krishna Arts and Science College',
    'skcet': 'Sri Krishna College of Engineering and Technology',
    'rathinam': 'Rathinam College of Arts and Science',
    'cit': 'Coimbatore Institute of Technology',
    'drngp': 'Dr. N.G.P. Arts and Science College',
    'sns': 'SNS College of Technology',
  }

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendCooldown])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    } else if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }

    if (newOtp.every(v => v !== '')) {
      handleVerify()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    if (otp.some(v => v === '')) return
    setError('')
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/auth/device-trust')
      router.refresh()
    } catch {
      setError('Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    setResendCooldown(60)
    setError('')
  }

  const handleMethodChange = (newMethod: 'email' | 'sms' | 'authenticator') => {
    setMethod(newMethod)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setTimeout(() => inputsRef.current[0]?.focus(), 100)
  }

  const otpComplete = otp.every(v => v !== '')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/auth/role" className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-primary-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Change Role</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary-600" />
            <div className="text-left">
              <p className="text-sm text-slate-500">Role</p>
              <p className="font-semibold text-slate-900">{roleLabels[role] || role}</p>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Two-Factor Authentication</h1>
          <p className="text-slate-600 mt-2">Enter the 6-digit code sent to your email</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Verification Code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to your registered email. Enter it below to verify your identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            <div className="flex items-center justify-center gap-2" role="group" aria-label="Verification code">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputsRef.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={cn(
                    'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-colors',
                    'bg-white text-slate-900',
                    digit ? 'border-primary-500 bg-primary-50' : 'border-slate-200 focus:border-primary-500',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                  )}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Digit ${index + 1}`}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Didn't receive the code?</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-slate-600 hover:text-primary-600"
              >
                {resendCooldown > 0 ? (
                  <>Resend in {resendCooldown}s <Loader2 className="w-4 h-4 ml-1 animate-spin" /></>
                ) : (
                  'Resend Code'
                )}
              </Button>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-3">
              <p className="text-sm text-slate-500 text-center">Or verify via</p>
              <div className="flex gap-3">
                {(['email', 'sms', 'authenticator'] as const).map(m => (
                  <Button
                    key={m}
                    variant={method === m ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleMethodChange(m)}
                  >
                    {m === 'email' && <Mail className="w-4 h-4" />}
                    {m === 'sms' && <Smartphone className="w-4 h-4" />}
                    {m === 'authenticator' && <Shield className="w-4 h-4" />}
                    <span className="capitalize">{m}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleVerify}
              disabled={!otpComplete || loading}
              loading={loading}
            >
              Verify & Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/auth/role" className="text-sm text-slate-600 hover:text-primary-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Role Selection
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TwoFAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <p className="text-slate-500">Loading verification...</p>
        </div>
      </div>
    }>
      <TwoFAPageContent />
    </Suspense>
  )
}