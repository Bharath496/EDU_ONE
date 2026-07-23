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

const popularColleges = [
  { name: 'PSG College of Technology', code: 'PSGCT', city: 'Coimbatore' },
  { name: 'PSG College of Arts and Science', code: 'PSGAS', city: 'Coimbatore' },
  { name: 'Kumaraguru College of Technology', code: 'KCT', city: 'Coimbatore' },
  { name: 'Sri Krishna College of Engineering', code: 'SKCET', city: 'Coimbatore' },
  { name: 'Rathinam College of Arts and Science', code: 'RCAS', city: 'Coimbatore' },
  { name: 'Sri Ramakrishna Engineering College', code: 'SREC', city: 'Coimbatore' },
  { name: 'Coimbatore Institute of Technology', code: 'CIT', city: 'Coimbatore' },
  { name: 'Government College of Technology', code: 'GCT', city: 'Coimbatore' },
]

const features = [
  { icon: Shield, title: 'Multi-Tenant Architecture', desc: 'Isolated data per institution' },
  { icon: GraduationCap, title: 'Complete Academics', desc: 'Courses, timetables, exams, assignments' },
  { icon: CalendarCheck, title: 'Smart Attendance', desc: 'QR, biometric, and manual marking' },
  { icon: IndianRupee, title: 'Fee Management', desc: 'Online payments, invoices, receipts' },
  { icon: Megaphone, title: 'Communication Hub', desc: 'Notices, announcements, messaging' },
  { icon: FileText, title: 'Analytics & Reports', desc: 'Real-time dashboards and exports' },
  { icon: Library, title: 'Digital Library', desc: 'E-books, catalog, issue tracking' },
  { icon: Settings, title: 'Role-Based Access', desc: '6 roles with granular permissions' },
]

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, isLoading } = useAuthStore()
  const [email, setEmail] = useState('dev@local')
  const [password, setPassword] = useState('dev@123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [college, setCollege] = useState('')

  useEffect(() => {
    if (isLoading) return
    const savedEmail = localStorage.getItem('saved_email')
    const savedCollege = localStorage.getItem('saved_college')
    if (savedEmail) setEmail(savedEmail)
    if (savedCollege) setCollege(savedCollege)
  }, [isLoading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Demo credentials
      const validCredentials = {
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
        if (college) localStorage.setItem('saved_college', college)
      }

      setAuth(session)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="text-white font-bold text-2xl">EduOne</span>
          </div>
        </div>

        <div className="space-y-8 text-white">
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
            One Platform. Every College. One Codebase.
          </h1>
          <p className="text-lg text-primary-100 max-w-lg">
            Streamline your institution with EduOne — academics, attendance, exams, fees, and communication in one modern, multi-tenant platform.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-primary-100">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-primary-100 text-sm">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span>Trusted by 500+ institutions across India</span>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <div className="hidden lg:block text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">EduOne</span>
            </Link>
          </div>

          <Card className="shadow-soft border-slate-200">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-slate-500">Sign in to your EduOne account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {error && (
                <div className={cn('flex items-center gap-2 p-3 rounded-xl text-sm', 'bg-red-50 border border-red-200 text-red-700')}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  autoComplete="current-password"
                  required
                />

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
                  <Link href="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  className="gap-2"
                  onClick={() => setError('Google SSO not configured in demo')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  className="gap-2"
                  onClick={() => setError('Microsoft SSO not configured in demo')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#00A4EF"
                      d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.52 17.34c-.12.24-.27.48-.42.72l-3.6 3.6c-.18.18-.42.27-.69.27-.27 0-.51-.09-.69-.27l-2.16-2.16c-.18-.18-.27-.42-.27-.69s.09-.51.27-.69l1.8-1.8V7.87c0-.27.09-.51.27-.69.18-.18.42-.27.69-.27.27 0 .51.09.69.27l1.8 1.8V7.87c0-.27.09-.51.27-.69.18-.18.42-.27.69-.27.27 0 .51.09.69.27l3.6 3.6c.18.18.27.42.27.69 0 .27-.09.51-.27.69l-1.8 1.8v5.43c0 .27-.09.51-.27.69-.18.18-.42.27-.69.27-.24 0-.48-.09-.69-.27z"
                    />
                  </svg>
                  <span>Microsoft</span>
                </Button>
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
    </div>
  )
}