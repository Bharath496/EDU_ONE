'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { ClipboardList, Plus, Search, ChevronRight, Calendar, Clock, Edit3, Award, Download, BookOpen } from 'lucide-react'

const EXAMS = [
  { id: '1', name: 'Mid Semester Exam', course: 'Data Structures', code: 'CSE-301', date: 'Aug 15, 2024', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 50, type: 'midterm', status: 'upcoming', students: 120, venue: 'Hall A' },
  { id: '2', name: 'Weekly Quiz 3', course: 'Database Systems', code: 'CSE-302', date: 'Jul 25, 2024', startTime: '10:00 AM', endTime: '11:00 AM', maxMarks: 20, type: 'quiz', status: 'upcoming', students: 85, venue: 'Lab 2' },
  { id: '3', name: 'Final Exam', course: 'Operating Systems', code: 'CSE-303', date: 'Nov 20, 2024', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 100, type: 'final', status: 'upcoming', students: 95, venue: 'Hall B' },
  { id: '4', name: 'Assignment 2 Review', course: 'Data Structures', code: 'CSE-301', date: 'Jul 18, 2024', startTime: '02:00 PM', endTime: '04:00 PM', maxMarks: 30, type: 'assignment', status: 'ongoing', students: 120, venue: 'Lab 1' },
  { id: '5', name: 'Mid Semester Exam', course: 'Database Systems', code: 'CSE-302', date: 'Aug 12, 2024', startTime: '09:00 AM', endTime: '12:00 PM', maxMarks: 50, type: 'midterm', status: 'draft', students: 85, venue: 'Hall A' },
  { id: '6', name: 'Weekly Quiz 2', course: 'Operating Systems', code: 'CSE-303', date: 'Jul 10, 2024', startTime: '11:00 AM', endTime: '12:00 PM', maxMarks: 20, type: 'quiz', status: 'completed', students: 95, venue: 'Online' },
]

export default function ExamsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = EXAMS.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.course.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Exams</h1>
          </div>
          <Button variant="primary" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Schedule Exam</Button>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Exams', value: EXAMS.length, icon: ClipboardList },
            { label: 'Upcoming', value: EXAMS.filter(e => e.status === 'upcoming').length, icon: Calendar },
            { label: 'Ongoing', value: EXAMS.filter(e => e.status === 'ongoing').length, icon: Clock },
            { label: 'Completed', value: EXAMS.filter(e => e.status === 'completed').length, icon: Award },
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
          <input type="text" placeholder="Search exams by name, course, or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => (
            <Card key={exam.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={exam.type === 'final' ? 'danger' : exam.type === 'midterm' ? 'primary' : exam.type === 'quiz' ? 'success' : 'warning'} size="sm">
                    {exam.type}
                  </Badge>
                  <StatusBadge status={exam.status} size="sm" />
                </div>
                <h3 className="font-semibold text-slate-900">{exam.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{exam.course} ({exam.code})</p>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {exam.date}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {exam.startTime} - {exam.endTime}</div>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Max Marks: {exam.maxMarks}</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-sm">
                  <span className="text-slate-500">{exam.students} students</span>
                  <span className="text-slate-500">{exam.venue}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}