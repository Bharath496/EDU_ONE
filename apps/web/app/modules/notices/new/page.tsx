'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { Megaphone, ChevronRight, ArrowLeft, Send, Paperclip } from 'lucide-react'

export default function NewNoticePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); router.push('/modules/notices') }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/modules/notices" className="hover:text-primary-600">Notices</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">New Notice</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Create Notice</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notice Details</CardTitle>
              <CardDescription>Create an announcement for students, faculty, or staff</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <Input label="Title" placeholder="e.g., Semester Exam Schedule Released" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <textarea rows={6} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Write your notice content here..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option>Everyone</option>
                    <option>All Students</option>
                    <option>Faculty Only</option>
                    <option>Staff Only</option>
                    <option>Specific Department</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (optional)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
                  <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Drag & drop files here, or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, images up to 10MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </Button>
            <Button type="submit" variant="primary" className="gap-2" loading={loading}>
              <Send className="w-4 h-4" /> Publish Notice
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}