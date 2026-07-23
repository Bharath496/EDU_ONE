'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { FilePen, Plus, Search, ChevronRight, Calendar, Clock, Download, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

const ASSIGNMENTS = [
  { id: '1', title: 'Binary Search Tree Implementation', course: 'Data Structures', code: 'CSE-301', dueDate: 'Jul 25, 2024', totalMarks: 20, submissions: 45, total: 120, status: 'active', type: 'coding' },
  { id: '2', title: 'Database Normalization Exercise', course: 'Database Systems', code: 'CSE-302', dueDate: 'Jul 28, 2024', totalMarks: 15, submissions: 32, total: 85, status: 'active', type: 'written' },
  { id: '3', title: 'Process Scheduling Algorithms', course: 'Operating Systems', code: 'CSE-303', dueDate: 'Aug 01, 2024', totalMarks: 25, submissions: 18, total: 95, status: 'active', type: 'coding' },
  { id: '4', title: 'Linked List Operations', course: 'Data Structures', code: 'CSE-301', dueDate: 'Jul 10, 2024', totalMarks: 20, submissions: 112, total: 120, status: 'grading', type: 'coding' },
  { id: '5', title: 'SQL Query Practice', course: 'Database Systems', code: 'CSE-302', dueDate: 'Jul 05, 2024', totalMarks: 10, submissions: 80, total: 85, status: 'completed', type: 'written' },
  { id: '6', title: 'Memory Management Essay', course: 'Operating Systems', code: 'CSE-303', dueDate: 'Jun 28, 2024', totalMarks: 15, submissions: 92, total: 95, status: 'completed', type: 'written' },
]

export default function AssignmentsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = ASSIGNMENTS.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Assignments</h1>
          </div>
          <Link href="/modules/assignments/new">
            <Button variant="primary" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Assignment</Button>
          </Link>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: ASSIGNMENTS.filter(a => a.status === 'active').length, icon: FilePen, color: 'blue' },
            { label: 'Pending Grading', value: ASSIGNMENTS.filter(a => a.status === 'grading').length, icon: Clock, color: 'amber' },
            { label: 'Completed', value: ASSIGNMENTS.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'green' },
            { label: 'Total Submissions', value: ASSIGNMENTS.reduce((s, a) => s + a.submissions, 0), icon: Upload, color: 'purple' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700"><stat.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search assignments by title or course..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="space-y-3">
          {filtered.map(a => (
            <Card key={a.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{a.title}</h3>
                      <Badge variant={a.type === 'coding' ? 'primary' : 'secondary'} size="sm">{a.type}</Badge>
                      <StatusBadge status={a.status} size="sm" />
                    </div>
                    <p className="text-sm text-slate-500">{a.course} ({a.code})</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Due: {a.dueDate}</div>
                      <div className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {a.totalMarks} marks</div>
                      <div className="flex items-center gap-1.5">
                        <Upload className="w-4 h-4" />
                        {a.submissions}/{a.total} submitted
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-4 h-4" /> View</Button>
                    {a.status === 'grading' && <Button variant="primary" size="sm">Grade</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}