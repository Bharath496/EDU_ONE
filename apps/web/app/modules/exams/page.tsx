'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  Calendar,
  ClipboardList,
  Clock3,
  Plus,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

export default function ExamsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const exams = useEduStore((state) => state.exams)
  const addExam = useEduStore((state) => state.addExam)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    course: 'Artificial Intelligence',
    code: 'AIML-501',
    date: '2026-10-20',
    startTime: '09:30',
    endTime: '11:30',
    maxMarks: 50,
    type: 'midterm' as 'midterm' | 'final' | 'quiz' | 'practical',
    status: 'upcoming' as 'draft' | 'upcoming' | 'ongoing' | 'completed',
    students: 42,
    venue: 'Hall A',
  })

  const filtered = exams.filter((exam) => {
    const needle = search.trim().toLowerCase()
    return (
      !needle ||
      exam.name.toLowerCase().includes(needle) ||
      exam.course.toLowerCase().includes(needle) ||
      exam.code.toLowerCase().includes(needle)
    )
  })

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    addExam({ ...form, name: form.name.trim() })
    setOpen(false)
    setForm({ ...form, name: '' })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Exams</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule and track assessments in the persistent demo workspace.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Schedule exam
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total exams', value: exams.length, icon: ClipboardList, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Upcoming', value: exams.filter((item) => item.status === 'upcoming').length, icon: Calendar, cls: 'bg-violet-50 text-violet-700' },
          { label: 'Ongoing', value: exams.filter((item) => item.status === 'ongoing').length, icon: Clock3, cls: 'bg-amber-50 text-amber-700' },
          { label: 'Completed', value: exams.filter((item) => item.status === 'completed').length, icon: Award, cls: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exam, course or code" leftIcon={<Search className="h-4 w-4 text-slate-400" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exam) => (
          <Card key={exam.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge variant={exam.type === 'final' ? 'danger' : exam.type === 'midterm' ? 'primary' : exam.type === 'quiz' ? 'success' : 'warning'} size="sm">{exam.type}</Badge>
                <Badge variant={exam.status === 'completed' ? 'success' : exam.status === 'ongoing' ? 'warning' : exam.status === 'draft' ? 'secondary' : 'primary'} size="sm">{exam.status}</Badge>
              </div>
              <h3 className="mt-4 font-semibold text-slate-950">{exam.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{exam.course} ({exam.code})</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4" />{exam.date}</p>
                <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{exam.startTime} - {exam.endTime}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
                <div><p className="font-bold text-slate-900">{exam.maxMarks}</p><p className="text-slate-500">marks</p></div>
                <div><p className="font-bold text-slate-900">{exam.students}</p><p className="text-slate-500">students</p></div>
                <div><p className="font-bold text-slate-900">{exam.venue}</p><p className="text-slate-500">venue</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule exam"
        description="Add an assessment to the local EDU_ONE workspace."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="exam-form">Create exam</Button></div>}
      >
        <form id="exam-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Input label="Exam name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <Input label="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <Input label="Course code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <Input label="Start time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label="End time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <Input label="Maximum marks" type="number" min={1} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} />
          <Input label="Student count" type="number" min={1} value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option><option value="practical">Practical</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option value="upcoming">Upcoming</option><option value="draft">Draft</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
