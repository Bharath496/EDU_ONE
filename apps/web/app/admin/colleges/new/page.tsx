'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { Building2, ChevronRight, ArrowLeft, Save, CheckCircle } from 'lucide-react'

export default function NewCollegePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">College Created!</h2>
            <p className="text-slate-500 mb-6">The college has been onboarded successfully. An admin invitation has been sent.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push('/admin/colleges')}>
                View Colleges
              </Button>
              <Button variant="primary" onClick={() => { setSuccess(false); setStep(1) }}>
                Add Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/admin/colleges" className="hover:text-primary-600">Colleges</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">New College</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Onboard New College</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">College Details</h2>
            <p className="text-sm text-slate-500">Fill in the information below to onboard a new institution</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {s === 1 ? 'Basic Info' : s === 2 ? 'Admin Setup' : 'Confirm'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Enter the college's core details</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Input label="College Name" placeholder="e.g., PSG College of Technology" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="College Code" placeholder="e.g., PSGCT" required />
                  <Input label="Domain" placeholder="e.g., psgct.edu" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" placeholder="e.g., Coimbatore" required />
                  <Input label="State" placeholder="e.g., Tamil Nadu" required />
                </div>
                <Input label="Address" placeholder="Full address of the institution" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" type="tel" placeholder="+91 9876543210" />
                  <Input label="Email" type="email" placeholder="info@college.edu" />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="primary" onClick={() => setStep(2)}>
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Admin Setup</CardTitle>
                <CardDescription>Create the college administrator account</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <Input label="Admin Name" placeholder="e.g., Dr. K. Prakasan" required />
                <Input label="Admin Email" type="email" placeholder="admin@college.edu" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" type="tel" placeholder="+91 9876543210" required />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                      <option>Enterprise - $2,499/mo</option>
                      <option>Pro - $999/mo</option>
                      <option>Standard - $299/mo</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" variant="primary" onClick={() => setStep(3)}>
                    Review & Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Review & Confirm</CardTitle>
                <CardDescription>Verify the information before onboarding</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                  <h4 className="font-medium text-slate-900">College Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Name:</span>
                    <span className="text-slate-900">PSG College of Technology</span>
                    <span className="text-slate-500">Code:</span>
                    <span className="text-slate-900">PSGCT</span>
                    <span className="text-slate-500">City:</span>
                    <span className="text-slate-900">Coimbatore, Tamil Nadu</span>
                    <span className="text-slate-500">Plan:</span>
                    <span className="text-slate-900">Enterprise</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 space-y-3">
                  <h4 className="font-medium text-slate-900">Admin Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500">Name:</span>
                    <span className="text-slate-900">Dr. K. Prakasan</span>
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-900">admin@psgct.edu</span>
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-900">+91 9876543210</span>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" className="gap-2" loading={loading}>
                    <Save className="w-4 h-4" />
                    Onboard College
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  )
}