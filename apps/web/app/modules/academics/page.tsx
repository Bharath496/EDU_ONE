'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  UserCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

type Tab = 'courses' | 'subjects' | 'timetable' | 'faculty'

export default function AcademicsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const courses = useEduStore((state) => state.courses)
  const faculty = useEduStore((state) => state.faculty)
  const addCourse = useEduStore((state) => state.addCourse)
  const toggleCourseStatus = useEduStore((state) => state.toggleCourseStatus)

  const [tab, setTab] = useState<Tab>('courses')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const canManage = user?.role === 'College Admin'
  const [form, setForm] = useState({
    code: '',
    name: '',
    credits: 4,
    department: 'AIML',
    semester: 5,
    facultyId: faculty[0]?.id ?? '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'Room 101',
    status: 'active' as 'active' | 'inactive',
  })

  const visibleCourses = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return courses.filter((course) => {
      const roleScoped =
        user?.role === 'Student' || user?.role === 'Parent'
          ? course.status === 'active'
          : true
      const matches =
        !needle ||
        course.name.toLowerCase().includes(needle) ||
        course.code.toLowerCase().includes(needle) ||
        course.department.toLowerCase().includes(needle)
      return roleScoped && matches
    })
  }, [courses, search, user?.role])

  if (!isAuthenticated || !user) {
    router.push('/')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !form.code.trim() || !form.name.trim()) return
    addCourse({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    })
    setOpen(false)
    setForm({ ...form, code: '', name: '' })
  }

  const activeCourses = courses.filter((item) => item.status === 'active').length
  const creditTotal = visibleCourses.reduce((sum, item) => sum + item.credits, 0)
  const departments = new Set(courses.map((item) => item.department)).size

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Academics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Courses, subjects, timetable and faculty assignment in one academic workspace.
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add course
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Courses', value: courses.length, icon: BookOpen },
          { label: 'Active', value: activeCourses, icon: GraduationCap },
          { label: 'Departments', value: departments, icon: UserCheck },
          { label: 'Visible credits', value: creditTotal, icon: CalendarDays },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['courses', 'Courses'],
          ['subjects', 'Subjects'],
          ['timetable', 'Time Table'],
          ['faculty', 'Faculty'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-primary-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === 'courses' || tab === 'subjects') && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="max-w-xl">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search course, subject code or department"
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => {
              const teacher = faculty.find((item) => item.id === course.facultyId)
              return (
                <Card key={course.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <CardDescription>{course.code} • {course.credits} credits</CardDescription>
                      </div>
                      <Badge variant={course.status === 'active' ? 'success' : 'secondary'} size="sm">{course.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <p>{course.department} • Semester {course.semester}</p>
                    <p className="flex items-center gap-2"><UserCheck className="h-4 w-4" />{teacher?.name ?? 'Faculty unassigned'}</p>
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{course.day}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{course.startTime} - {course.endTime}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{course.room}</p>
                    {canManage && (
                      <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => toggleCourseStatus(course.id)}>
                        {course.status === 'active' ? 'Deactivate course' : 'Activate course'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {tab === 'timetable' && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly time table</CardTitle>
            <CardDescription>Built from the same course catalog instead of another unrelated mock table.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
              const dayCourses = visibleCourses.filter((course) => course.day === day && course.status === 'active')
              return (
                <div key={day}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{day}</p>
                  {dayCourses.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {dayCourses.map((course) => (
                        <div key={course.id} className="rounded-xl border border-slate-200 p-4">
                          <p className="font-semibold text-slate-900">{course.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{course.code} • {course.startTime}-{course.endTime} • {course.room}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No scheduled courses.</p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {tab === 'faculty' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {faculty.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-950">{member.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{member.designation} • {member.department}</p>
                <p className="mt-3 text-sm text-slate-600">{member.qualification}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {courses.filter((course) => course.facultyId === member.id && course.status === 'active').length} active courses
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={canManage && open}
        onClose={() => setOpen(false)}
        title="Add course"
        description="Creates a new academic course in the local demo workspace."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="course-form">Add course</Button></div>}
      >
        <form id="course-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Course code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Course name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Semester" type="number" min={1} max={12} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          <Input label="Credits" type="number" min={1} max={10} value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
          <Input label="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Faculty</label>
            <select value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              {faculty.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Day</label>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => <option key={day}>{day}</option>)}
            </select>
          </div>
          <Input label="Start time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label="End time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </form>
      </Modal>
    </div>
  )
}
