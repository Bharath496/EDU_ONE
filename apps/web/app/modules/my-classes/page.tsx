'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { BookOpen, Clock, MapPin, Users, Calendar, ChevronRight } from 'lucide-react'

const CLASSES = [
  { id: '1', course: 'Data Structures', code: 'CSE-301', day: 'Monday', time: '09:00 - 10:30', room: 'Lab 3', building: 'CS Block', students: 60, type: 'Lab', section: 'A' },
  { id: '2', course: 'Database Systems', code: 'CSE-302', day: 'Monday', time: '11:00 - 12:30', room: 'Room 204', building: 'Main Block', students: 85, type: 'Lecture', section: 'A' },
  { id: '3', course: 'Data Structures', code: 'CSE-301', day: 'Tuesday', time: '09:00 - 10:30', room: 'Lab 3', building: 'CS Block', students: 55, type: 'Lab', section: 'B' },
  { id: '4', course: 'Operating Systems', code: 'CSE-303', day: 'Wednesday', time: '10:00 - 11:30', room: 'Room 101', building: 'Main Block', students: 95, type: 'Lecture', section: 'A' },
  { id: '5', course: 'Database Systems', code: 'CSE-302', day: 'Thursday', time: '14:00 - 15:30', room: 'Lab 2', building: 'IT Block', students: 85, type: 'Lab', section: 'A' },
  { id: '6', course: 'Operating Systems', code: 'CSE-303', day: 'Friday', time: '09:00 - 10:30', room: 'Room 101', building: 'Main Block', students: 95, type: 'Tutorial', section: 'A' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function MyClassesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">My Classes</h1>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Classes', value: CLASSES.length, icon: BookOpen },
            { label: 'Courses', value: [...new Set(CLASSES.map(c => c.course))].length, icon: BookOpen },
            { label: 'Total Students', value: CLASSES.reduce((s, c) => s + c.students, 0), icon: Users },
            { label: 'This Week', value: `${5} days`, icon: Calendar },
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

        {DAYS.map(day => {
          const dayClasses = CLASSES.filter(c => c.day === day)
          if (dayClasses.length === 0) return null
          return (
            <div key={day}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{day}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayClasses.map(cls => (
                  <Card key={cls.id} className="hover:shadow-soft transition-shadow border-l-4 border-l-primary-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{cls.course}</h3>
                          <p className="text-sm text-slate-500">{cls.code} • Section {cls.section}</p>
                        </div>
                        <Badge variant={cls.type === 'Lab' ? 'success' : cls.type === 'Tutorial' ? 'warning' : 'primary'} size="sm">{cls.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {cls.time}</div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {cls.room}</div>
                        <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {cls.students}</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs text-slate-400">{cls.building}</span>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs"><span>Mark Attendance</span><ChevronRight className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}