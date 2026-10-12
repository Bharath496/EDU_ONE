'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck,
  Download,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'
import type { StudentRecord } from '@/lib/demo-data'

type StudentForm = Omit<StudentRecord, 'id'>

const emptyForm: StudentForm = {
  name: '',
  regNo: '',
  department: 'AIML',
  semester: 1,
  batch: '2026-29',
  email: '',
  phone: '',
  attendance: 100,
  cgpa: 0,
  status: 'active',
}

function toCsv(rows: StudentRecord[]) {
  const header = ['Reg No', 'Name', 'Department', 'Semester', 'Batch', 'Email', 'Phone', 'Attendance', 'CGPA', 'Status']
  const body = rows.map((student) => [
    student.regNo,
    student.name,
    student.department,
    student.semester,
    student.batch,
    student.email,
    student.phone,
    student.attendance,
    student.cgpa,
    student.status,
  ])
  return [header, ...body]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
}

function downloadCsv(rows: StudentRecord[]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'eduone-students.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function StudentsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const addStudent = useEduStore((state) => state.addStudent)
  const updateStudent = useEduStore((state) => state.updateStudent)
  const removeStudent = useEduStore((state) => state.removeStudent)

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All')
  const [status, setStatus] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<StudentForm>(emptyForm)

  const departments = ['All', ...Array.from(new Set(students.map((item) => item.department))).sort()]

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch =
        !needle ||
        student.name.toLowerCase().includes(needle) ||
        student.regNo.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle)
      const matchesDepartment = department === 'All' || student.department === department
      const matchesStatus = status === 'All' || student.status === status.toLowerCase()
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [department, search, status, students])

  const activeCount = students.filter((item) => item.status === 'active').length
  const avgAttendance = students.length
    ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length)
    : 0
  const atRisk = students.filter((item) => item.attendance < 75 || item.cgpa < 6).length

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (student: StudentRecord) => {
    const { id, ...rest } = student
    setEditingId(id)
    setForm(rest)
    setFormOpen(true)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized: StudentForm = {
      ...form,
      name: form.name.trim(),
      regNo: form.regNo.trim().toUpperCase(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      semester: Number(form.semester),
      attendance: Number(form.attendance),
      cgpa: Number(form.cgpa),
    }
    if (!normalized.name || !normalized.regNo || !normalized.email) return
    if (editingId) updateStudent(editingId, normalized)
    else addStudent(normalized)
    setFormOpen(false)
  }

  const deleteStudent = (student: StudentRecord) => {
    if (window.confirm(`Remove ${student.name} (${student.regNo}) from the demo workspace?`)) {
      removeStudent(student.id)
    }
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
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Student Records</h1>
          <p className="mt-1 text-sm text-slate-500">
            Persistent local demo data. Add, edit, filter and export without a paid database.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadCsv(filtered)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total students', value: students.length, icon: GraduationCap, className: 'bg-blue-50 text-blue-700' },
          { label: 'Active', value: activeCount, icon: UserCheck, className: 'bg-emerald-50 text-emerald-700' },
          { label: 'Average attendance', value: `${avgAttendance}%`, icon: CalendarCheck, className: 'bg-violet-50 text-violet-700' },
          { label: 'Needs attention', value: atRisk, icon: MoreHorizontal, className: 'bg-amber-50 text-amber-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.className}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, register number or email"
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              {departments.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Register no.</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 text-center font-medium">Sem</th>
                  <th className="px-4 py-3 text-center font-medium">Attendance</th>
                  <th className="px-4 py-3 text-center font-medium">CGPA</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600">{student.regNo}</td>
                    <td className="px-4 py-4 text-slate-600">{student.department}</td>
                    <td className="px-4 py-4 text-center text-slate-600">{student.semester}</td>
                    <td className="px-4 py-4">
                      <div className="mx-auto flex w-28 items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${student.attendance >= 75 ? 'bg-emerald-500' : student.attendance >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(student.attendance, 100)}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold text-slate-700">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-semibold ${student.cgpa >= 8 ? 'text-emerald-700' : student.cgpa >= 6 ? 'text-amber-700' : 'text-red-700'}`}>
                        {student.cgpa.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => updateStudent(student.id, { status: student.status === 'active' ? 'inactive' : 'active' })}
                        title="Toggle status"
                      >
                        <Badge variant={student.status === 'active' ? 'success' : 'danger'} size="sm">
                          {student.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(student)} aria-label="Edit student">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteStudent(student)} aria-label="Delete student">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <div className="px-6 py-14 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-800">No matching students</p>
              <p className="text-sm text-slate-500">Change the filters or add a new student.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit student' : 'Add student'}
        description="Changes are saved in this browser for the portfolio demo."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="student-form">{editingId ? 'Save changes' : 'Add student'}</Button>
          </div>
        }
      >
        <form id="student-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Register number" value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {['AIML', 'CSE', 'Data Science', 'IT', 'ECE', 'Mechanical', 'Biotech'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <Input label="Batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
          <Input label="Semester" type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <Input label="CGPA" type="number" min={0} max={10} step="0.1" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: Number(e.target.value) })} />
          <Input label="Attendance %" type="number" min={0} max={100} value={form.attendance} onChange={(e) => setForm({ ...form, attendance: Number(e.target.value) })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
