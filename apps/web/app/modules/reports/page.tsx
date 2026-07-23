'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { FileText, Download, ChevronRight, Calendar, BarChart3, GraduationCap, UserCheck, IndianRupee, Library, Megaphone, ClipboardList } from 'lucide-react'

const REPORT_TYPES = [
  { id: 'attendance', title: 'Attendance Report', desc: 'Student attendance summary by course, department, or date range', icon: UserCheck, color: 'blue', formats: ['PDF', 'CSV', 'Excel'] },
  { id: 'academic', title: 'Academic Performance', desc: 'Grade sheets, CGPA distribution, and course-wise results', icon: GraduationCap, color: 'green', formats: ['PDF', 'Excel'] },
  { id: 'fee', title: 'Fee Collection Report', desc: 'Payment status, collection summary, and pending dues', icon: IndianRupee, color: 'purple', formats: ['PDF', 'CSV', 'Excel'] },
  { id: 'exam', title: 'Exam Analysis', desc: 'Pass percentage, score distribution, and subject-wise analysis', icon: ClipboardList, color: 'amber', formats: ['PDF', 'Excel'] },
  { id: 'library', title: 'Library Report', desc: 'Book usage, issued items, overdue tracking, and inventory', icon: Library, color: 'indigo', formats: ['PDF', 'CSV'] },
  { id: 'notice', title: 'Notice Analytics', desc: 'Notice reach, views, and engagement metrics', icon: Megaphone, color: 'cyan', formats: ['PDF', 'CSV'] },
]

const SCHEDULED_REPORTS = [
  { name: 'Weekly Attendance Summary', frequency: 'Every Monday', format: 'PDF', recipients: 'HODs, Principal', nextRun: 'Jul 22, 2024', status: 'active' },
  { name: 'Monthly Fee Report', frequency: '1st of Month', format: 'Excel', recipients: 'Accounts Dept', nextRun: 'Aug 01, 2024', status: 'active' },
  { name: 'Academic Performance Review', frequency: 'End of Semester', format: 'PDF', recipients: 'Faculty, Management', nextRun: 'Nov 30, 2024', status: 'draft' },
]

export default function ReportsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Reports & Exports</h1>
          </div>
          <Button variant="primary" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" /> Schedule Report
          </Button>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Generate Reports</CardTitle>
            <CardDescription>Select a report type to generate and export</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TYPES.map(report => (
                <div key={report.id} className="p-5 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                      <report.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{report.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{report.desc}</p>
                  <div className="flex items-center gap-2">
                    {report.formats.map(f => (
                      <Badge key={f} variant="secondary" size="sm">{f}</Badge>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Download className="w-4 h-4" /> Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Scheduled Reports</CardTitle>
              <CardDescription>Automated reports generated on a schedule</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" /> Schedule New
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {SCHEDULED_REPORTS.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-medium text-slate-900">{r.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>Frequency: {r.frequency}</span>
                      <span>Format: {r.format}</span>
                      <span>To: {r.recipients}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Next run: {r.nextRun}</p>
                  </div>
                  <Badge variant={r.status === 'active' ? 'success' : 'secondary'} size="sm">{r.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}