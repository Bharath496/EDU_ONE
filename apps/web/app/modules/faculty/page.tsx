'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Download,
  GraduationCap,
  Mail,
  Plus,
  Search,
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

export default function FacultyPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const faculty = useEduStore((state) => state.faculty)
  const addFaculty = useEduStore((state) => state.addFaculty)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    empId: '',
    department: 'AIML',
    designation: 'Assistant Professor',
    email: '',
    phone: '',
    courses: 2,
    students: 80,
    experience: '2 yrs',
    qualification: 'M.Tech',
    status: 'active' as 'active' | 'inactive',
  })

  const filtered = faculty.filter((item) => {
    const needle = search.trim().toLowerCase()
    return (
      !needle ||
      item.name.toLowerCase().includes(needle) ||
      item.department.toLowerCase().includes(needle) ||
      item.designation.toLowerCase().includes(needle) ||
      item.empId.toLowerCase().includes(needle)
    )
  })

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.empId.trim()) return
    addFaculty({
      ...form,
      name: form.name.trim(),
      empId: form.empId.trim().toUpperCase(),
      email: form.email.trim().toLowerCase(),
    })
    setOpen(false)
    setForm({ ...form, name: '', empId: '', email: '', phone: '' })
  }

  const exportCsv = () => {
    const csv = [
      ['Employee ID', 'Name', 'Department', 'Designation', 'Email', 'Phone', 'Courses', 'Students', 'Experience', 'Qualification', 'Status'],
      ...filtered.map((item) => [item.empId, item.name, item.department, item.designation, item.email, item.phone, item.courses, item.students, item.experience, item.qualification, item.status]),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'eduone-faculty.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Faculty</h1>
          <p className="mt-1 text-sm text-slate-500">Manage teaching staff and export the current faculty directory.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" />Export</Button>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add faculty</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total faculty', faculty.length, UserCheck, 'bg-blue-50 text-blue-700'],
          ['Active', faculty.filter((item) => item.status === 'active').length, UserCheck, 'bg-emerald-50 text-emerald-700'],
          ['Departments', new Set(faculty.map((item) => item.department)).size, BookOpen, 'bg-violet-50 text-violet-700'],
          ['Courses handled', faculty.reduce((sum, item) => sum + item.courses, 0), GraduationCap, 'bg-amber-50 text-amber-700'],
        ].map(([label, value, Icon, cls]) => {
          const StatIcon = Icon as typeof UserCheck
          return (
            <Card key={String(label)}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-2xl p-3 ${cls}`}><StatIcon className="h-6 w-6" /></div>
                <div><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-950">{value}</p></div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search faculty" leftIcon={<Search className="h-4 w-4 text-slate-400" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={item.name} size="md" />
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.designation}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'active' ? 'success' : 'secondary'} size="sm">{item.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{item.email}</p>
                <p className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{item.department} • {item.empId}</p>
                <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{item.qualification}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center text-xs">
                <div><p className="font-bold text-slate-900">{item.courses}</p><p className="text-slate-500">courses</p></div>
                <div><p className="font-bold text-slate-900">{item.students}</p><p className="text-slate-500">students</p></div>
                <div><p className="font-bold text-slate-900">{item.experience}</p><p className="text-slate-500">experience</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add faculty"
        description="Add a staff member to the persistent portfolio workspace."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="faculty-form">Add faculty</Button></div>}
      >
        <form id="faculty-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Employee ID" value={form.empId} onChange={(e) => setForm({ ...form, empId: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <Input label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          <Input label="Experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          <Input label="Courses" type="number" min={0} value={form.courses} onChange={(e) => setForm({ ...form, courses: Number(e.target.value) })} />
          <Input label="Students" type="number" min={0} value={form.students} onChange={(e) => setForm({ ...form, students: Number(e.target.value) })} />
        </form>
      </Modal>
    </div>
  )
}
