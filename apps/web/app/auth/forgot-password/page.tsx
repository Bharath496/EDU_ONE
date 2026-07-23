'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Mail, ArrowLeft } from 'lucide-react'

function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verify' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      setStep('verify')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-primary-600">
            <span>←</span>
            <span>Back to Login</span>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-slate-600 mt-2">Enter your email to receive a password reset link</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Reset Your Password</CardTitle>
            <CardDescription>We'll send a 6-digit code to your email</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                leftIcon={<span className="w-5 h-5">📧</span>}
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-600">
                Remember your password?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
</div>
  )
}
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}