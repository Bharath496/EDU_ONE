'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Calendar, Clock3, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

const CLASSES = [
  { id: '1', course: 'Artificial Intelligence', code: 'AIML-501', day: 'Monday', time: '09:00 - 10:30', room: 'AI Lab', building: 'Tech Block', type: 'Lab', section: 'A' },
  { id: '2', course: 'Machine Learning', code: 'AIML-502', day: 'Monday', time: '11:00 - 12:30', room: 'Room 204', building: 'Main Block', type: 'Lecture', section: 'A' },
  { id: '3', course: 'Database Systems', code: 'CSE-302', day: 'Tuesday', time: '09:30 - 11:00', room: 'Lab 2', building: 'IT Block', type: 'Lab', section: 'B' },
  { id: '4', course: 'Artificial Intelligence', code: 'AIML-501', day: 'Wednesday', time: '10:00 - 11:30', room: 'Room 101', building: 'Tech Block', type: 'Lecture', section: 'A' },
  { id: '5', course: 'Machine Learning', code: 'AIML-502', day: 'Thursday', time: '14:00 - 15:30', room: 'AI Lab', building: 'Tech Block', type: 'Practical', section: 'A' },
  { id: '6', course: 'Database Systems', code: 'CSE-302', day: 'Friday', time: '09:00 - 10:30', room: 'Room 305', building: 'Main Block', type: 'Tutorial', section: 'B' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function MyClassesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const assignments = useEduStore((state) => state.assignments)
  const exams = useEduStore((state) => state.exams)

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date())
  const courseCount = new Set(CLASSES.map((item) => item.course)).size

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div>
        <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">My Classes</h1>
        <p className="mt-1 text-sm text-slate-500">Weekly teaching plan connected to attendance, assignments and exam workflows.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Weekly classes', value: CLASSES.length, icon: BookOpen },
          { label: 'Courses', value: courseCount, icon: BookOpen },
          { label: 'Students', value: students.length, icon: Users },
          { label: 'Open coursework', value: assignments.filter((item) => item.status === 'published').length + exams.filter((item) => item.status === 'upcoming').length, icon: Calendar },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-700"><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {DAYS.map((day) => {
        const dayClasses = CLASSES.filter((item) => item.day === day)
        if (!dayClasses.length) return null
        return (
          <section key={day}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{day}</h2>
              {day === today && <Badge variant="primary" size="sm">Today</Badge>}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dayClasses.map((item) => (
                <Card key={item.id} className={day === today ? 'border-primary-200' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{item.course}</h3>
                        <p className="text-sm text-slate-500">{item.code} • Section {item.section}</p>
                      </div>
                      <Badge variant={item.type === 'Lab' || item.type === 'Practical' ? 'success' : item.type === 'Tutorial' ? 'warning' : 'primary'} size="sm">{item.type}</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{item.time}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{item.room} • {item.building}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <Link href="/modules/attendance" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
                        Open attendance workspace →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
