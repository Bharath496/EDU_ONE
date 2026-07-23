'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import {
  Building2,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  ClipboardList,
  FilePen,
  Library,
  IndianRupee,
  Megaphone,
  FileText,
  Settings,
  Shield,
  CheckCircle,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react'

const INSTITUTIONS = [
  { id: 'psg-arts', name: 'PSG College of Arts and Science', city: 'Coimbatore', logo: '🏛️' },
  { id: 'psg-tech', name: 'PSG College of Technology', city: 'Coimbatore', logo: '🏫' },
  { id: 'kct', name: 'Kumaraguru College of Technology', city: 'Coimbatore', logo: '🏭' },
  { id: 'skasc', name: 'Sri Krishna Arts and Science College', city: 'Coimbatore', logo: '🏛️' },
  { id: 'skcet', name: 'Sri Krishna College of Engineering and Technology', city: 'Coimbatore', logo: '🏭' },
  { id: 'rathinam', name: 'Rathinam College of Arts and Science', city: 'Coimbatore', logo: '🏛️' },
  { id: 'cit', name: 'Coimbatore Institute of Technology', city: 'Coimbatore', logo: '🏭' },
  { id: 'drngp', name: 'Dr. N.G.P. Arts and Science College', city: 'Coimbatore', logo: '🏛️' },
  { id: 'sns', name: 'SNS College of Technology', city: 'Coimbatore', logo: '🏭' },
  { id: 'other', name: 'Other Institution', city: '', logo: '➕' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'login' | 'institution' | '2fa'>('login')
  const [selectedInstitution, setSelectedInstitution] = useState<string>('')
  const [customInstitution, setCustomInstitution] = useState('')
  const [email, setEmail] = useState('dev@local')
  const [password, setPassword] = useState('dev@123')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('saved_email')
    const savedInstitution = localStorage.getItem('saved_institution')
    if (savedEmail) setEmail(savedEmail)
    if (savedInstitution) setSelectedInstitution(savedInstitution)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const validCredentials: Record<string, { password: string; role: string; name: string; college: string }> = {
        'dev@local': { password: 'dev@123', role: 'Super Admin', name: 'Platform Admin', college: 'EduOne Platform' },
        'admin@psgct.edu': { password: 'admin123', role: 'College Admin', name: 'Dr. Rajesh Kumar', college: 'PSG College of Technology' },
        'faculty@psgct.edu': { password: 'faculty123', role: 'Faculty', name: 'Prof. Priya Sharma', college: 'PSG College of Technology' },
        'student@psgct.edu': { password: 'student123', role: 'Student', name: 'Arjun Patel', college: 'PSG College of Technology' },
        'parent@psgct.edu': { password: 'parent123', role: 'Parent', name: 'Mr. Suresh Patel', college: 'PSG College of Technology' },
      }

      const creds = validCredentials[email as keyof typeof validCredentials]
      if (!creds || creds.password !== password) {
        throw new Error('Invalid email or password')
      }

      const user = {
        id: '1',
        email,
        name: creds.name,
        role: creds.role,
        collegeId: 'psgct',
        collegeName: creds.college,
        avatar: undefined,
      }

      const session = {
        user,
        token: 'demo-token-' + Date.now(),
        refreshToken: 'refresh-token-' + Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }

      if (rememberMe) {
        localStorage.setItem('saved_email', email)
        if (selectedInstitution) localStorage.setItem('saved_institution', selectedInstitution)
      }

      setAuth(session)
      router.push('/auth/splash')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInstitutionSelect = (instId: string) => {
    setSelectedInstitution(instId)
    if (instId === 'other') {
      setStep('login')
    } else {
      setStep('2fa')
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      setLoading(false)
      return
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
              <span className="text-3xl font-bold text-slate-900">EduOne</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-600 mt-2">Sign in to your account to continue</p>
          </div>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', 'bg-red-50 border border-red-200 text-red-700')}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  leftIcon={<Mail className="w-5 h-5" />}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    leftIcon={<Lock className="w-5 h-5" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Sign In
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => setError('Google SSO not configured in demo')}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => setError('Microsoft SSO not configured in demo')}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#00A4EF"
                        d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.52 17.34c-.12.24-.27.48-.42.72l-3.6 3.6c-.18.18-.42.27-.69.27-.27 0-.51-.09-.69-.27l-2.16-2.16c-.18-.18-.27-.42-.27-.69s.09-.51.27-.69l1.8-1.8V7.87c0-.27.09-.51.27-.69.18-.18.42-.27.69-.27.27 0 .51.09.69.27l1.8 1.8V7.87c0-.27.09-.51.27-.69.18-.18.42-.27.69-.27.27 0 .51.09.69.27l3.6 3.6c.18.18.27.42.27.69 0 .27-.09.51-.27.69l-1.8 1.8v5.43c0 .27-.09.51-.27.69-.18.18-.42.27-.69.27-.24 0-.48-.09-.69-.27z"
                      />
                    </svg>
                    <span>Microsoft</span>
                  </Button>
                </div>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link href="/contact-sales" className="text-primary-600 hover:text-primary-700 font-medium">
                  Contact Sales
                </Link>
              </p>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm font-medium text-slate-700 mb-2">Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-900">Super Admin:</span>
                    <code className="block text-primary-600">dev@local / dev@123</code>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-900">College Admin:</span>
                    <code className="block text-primary-600">admin@psgct.edu / admin123</code>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-900">Faculty:</span>
                    <code className="block text-primary-600">faculty@psgct.edu / faculty123</code>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-900">Student:</span>
                    <code className="block text-primary-600">student@psgct.edu / student123</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'institution') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
              <span className="text-3xl font-bold text-slate-900">EduOne</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Select Your Institution</h1>
            <p className="text-slate-600 mt-2">Choose your college or university to continue</p>
          </div>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Search Institutions</label>
                <Input
                  placeholder="Search by name or city..."
                  leftIcon={<Building2 className="w-5 h-5" />}
                  className="w-full"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {INSTITUTIONS.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handleInstitutionSelect(inst.id)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4',
                      selectedInstitution === inst.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    )}
                  >
                    <span className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
                      {inst.logo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{inst.name}</p>
                      {inst.city && <p className="text-sm text-slate-500">{inst.city}</p>}
                    </div>
                    {selectedInstitution === inst.id && (
                      <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {selectedInstitution === 'other' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <Input
                    label="Institution Name"
                    placeholder="Enter your institution name"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-6">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedInstitution || (selectedInstitution === 'other' && !customInstitution.trim())}
                  onClick={() => {
                    if (selectedInstitution === 'other') {
                      setStep('login')
                    } else {
                      setStep('2fa')
                    }
                  }}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="text-3xl font-bold text-slate-900">EduOne</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
          <p className="text-slate-600 mt-2">Enter the 6-digit code sent to your email</p>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <form onSubmit={handle2FA} className="space-y-4">
              {error && (
                <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', 'bg-red-50 border border-red-200 text-red-700')}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={cn(
                      'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-colors',
                      'bg-white text-slate-900',
                      digit ? 'border-primary-500 bg-primary-50' : 'border-slate-200 focus:border-primary-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                    )}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <p className="text-center text-sm text-slate-500">
                Didn&apos;t receive the code?{' '}
                <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                  Resend (00:30)
                </button>
              </p>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Verify & Continue
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500">
                Having trouble?{' '}
                <Link href="/support" className="text-primary-600 hover:text-primary-700 font-medium">
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}