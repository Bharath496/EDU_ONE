'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CheckCircle2,
  Clock3,
  FilePen,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

export default function AssignmentsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const assignments = useEduStore((state) => state.assignments)
  const students = useEduStore((state) => state.students)
  const assignmentSubmissions = useEduStore((state) => state.assignmentSubmissions)
  const addAssignment = useEduStore((state) => state.addAssignment)
  const submitAssignment = useEduStore((state) => state.submitAssignment)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [open, setOpen] = useState(false)
  const canManage = user?.role === 'College Admin' || user?.role === 'Faculty'
  const canSubmit = user?.role === 'Student'
  const matchedStudent =
    students.find((student) => student.name.toLowerCase() === user?.name.toLowerCase()) ??
    students[0]

  const [form, setForm] = useState({
    title: '',
    course: 'Artificial Intelligence',
    department: 'AIML',
    dueDate: '2026-10-20',
    maxMarks: 50,
    totalStudents: 42,
    status: 'published' as 'draft' | 'published' | 'closed',
  })

  const visibleAssignments = canManage
    ? assignments
    : assignments.filter((assignment) => assignment.status !== 'draft')

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return visibleAssignments.filter((assignment) => {
      const matchesSearch =
        !needle ||
        assignment.title.toLowerCase().includes(needle) ||
        assignment.course.toLowerCase().includes(needle) ||
        assignment.department.toLowerCase().includes(needle)
      const matchesStatus = status === 'All' || assignment.status === status.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [search, status, visibleAssignments])

  const published = visibleAssignments.filter((item) => item.status === 'published').length
  const drafts = visibleAssignments.filter((item) => item.status === 'draft').length
  const closed = visibleAssignments.filter((item) => item.status === 'closed').length
  const submissions = visibleAssignments.reduce((sum, item) => sum + item.submissions, 0)

  const createAssignment = (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !form.title.trim()) return
    addAssignment({ ...form, title: form.title.trim() })
    setOpen(false)
    setForm({ ...form, title: '' })
  }

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManage
              ? 'Create and track coursework from one persistent demo workspace.'
              : 'Review published coursework and submission status in a read-focused student view.'}
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Create assignment
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Published', value: published, icon: FilePen, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Drafts', value: drafts, icon: Clock3, cls: 'bg-amber-50 text-amber-700' },
          { label: 'Closed', value: closed, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Submissions', value: submissions, icon: Upload, cls: 'bg-violet-50 text-violet-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, course or department"
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option>All</option>
            <option>Published</option>
            {canManage && <option>Draft</option>}
            <option>Closed</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((assignment) => {
          const completion = assignment.totalStudents
            ? Math.round((assignment.submissions / assignment.totalStudents) * 100)
            : 0
          return (
            <Card key={assignment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription>{assignment.course} • {assignment.department}</CardDescription>
                  </div>
                  <Badge
                    variant={assignment.status === 'published' ? 'primary' : assignment.status === 'closed' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {assignment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Due date</p>
                    <p className="mt-1 flex items-center gap-1 font-medium text-slate-900"><Calendar className="h-3.5 w-3.5" />{assignment.dueDate}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Marks</p>
                    <p className="mt-1 font-medium text-slate-900">{assignment.maxMarks}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="mt-1 font-medium text-slate-900">{assignment.submissions}/{assignment.totalStudents}</p>
                  </div>
                </div>
                {canManage ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Submission progress</span>
                      <span className="font-semibold text-slate-700">{completion}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                ) : matchedStudent ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Your submission</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {assignmentSubmissions.some(
                          (item) => item.assignmentId === assignment.id && item.studentId === matchedStudent.id
                        )
                          ? 'Submitted'
                          : assignment.status === 'closed'
                            ? 'Closed'
                            : 'Not submitted'}
                      </p>
                    </div>
                    {canSubmit && assignment.status === 'published' && !assignmentSubmissions.some(
                      (item) => item.assignmentId === assignment.id && item.studentId === matchedStudent.id
                    ) && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => submitAssignment(assignment.id, matchedStudent.id)}
                      >
                        <Upload className="h-4 w-4" />
                        Submit demo
                      </Button>
                    )}
                    {assignmentSubmissions.some(
                      (item) => item.assignmentId === assignment.id && item.studentId === matchedStudent.id
                    ) && (
                      <Badge variant="success" size="sm">Submitted</Badge>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!filtered.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No assignments match the filters.</div>}

      <Modal
        open={canManage && open}
        onClose={() => setOpen(false)}
        title="Create assignment"
        description="The assignment will persist in this browser demo."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="assignment-form">Create</Button>
          </div>
        }
      >
        <form id="assignment-form" onSubmit={createAssignment} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Assignment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <Input label="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Maximum marks" type="number" min={1} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} />
          <Input label="Class strength" type="number" min={1} value={form.totalStudents} onChange={(e) => setForm({ ...form, totalStudents: Number(e.target.value) })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' | 'closed' })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
