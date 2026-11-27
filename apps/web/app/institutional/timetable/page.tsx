'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock3, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'

type TimetableSlot = {
  id: string
  course_code: string | null
  course_title: string | null
  faculty_name: string | null
  weekday: number
  start_time: string
  end_time: string
  room: string | null
}

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_at: string
  end_at: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function monthRange() {
  const now = new Date()
  return {
    start_at: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end_at: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function InstitutionalTimetablePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    const range = monthRange()
    const [calendarResult, timetableResult] = await Promise.allSettled([
      api.getInstitutionalCalendar(range),
      user.role === 'Student'
        ? api.getMyTimetable()
        : user.role === 'Faculty'
          ? api.getFacultyTimetable()
          : Promise.resolve([]),
    ])

    if (calendarResult.status === 'fulfilled') {
      setEvents(calendarResult.value as CalendarEvent[])
    } else {
      setEvents([])
      setError('The academic calendar could not be loaded. Check the API connection and try again.')
    }

    if (timetableResult.status === 'fulfilled') {
      setSlots(timetableResult.value as TimetableSlot[])
    } else {
      setSlots([])
      setError((current) => current || 'Your timetable could not be loaded. Your account may not have an active class or course assignment yet.')
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) router.replace('/auth/sign-in')
  }, [authLoading, isAuthenticated, router, user])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) void load()
  }, [authLoading, isAuthenticated, load, user])

  if (authLoading || loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading timetable and academic calendar...</main>
  }

  if (!isAuthenticated || !user) return null

  const canViewTimetable = user.role === 'Student' || user.role === 'Faculty'

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Institutional workspace</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">Timetable & Academic Calendar</h1>
            <p className="mt-1 text-sm text-slate-500">{user.name} · {user.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button variant="outline" onClick={() => router.push('/institutional')}>Workspace</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Weekly timetable</h2>
              <p className="mt-1 text-sm text-slate-500">{canViewTimetable ? 'Current timetable for your class or assigned courses.' : 'A personal class timetable is available to student and faculty accounts.'}</p>
            </div>
            <span className="text-xs text-slate-500">{slots.length} active slots</span>
          </div>
          {canViewTimetable ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {WEEKDAYS.slice(1).concat(WEEKDAYS[0]).map((day, index) => {
                const weekday = (index + 1) % 7
                const daySlots = slots.filter((slot) => slot.weekday === weekday).sort((a, b) => a.start_time.localeCompare(b.start_time))
                return (
                  <Card key={day}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{day}</CardTitle>
                      <CardDescription>{daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {daySlots.length ? daySlots.map((slot) => (
                        <div key={slot.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="font-semibold text-slate-900">{slot.course_title || slot.course_code || 'Course'}</p>
                          <p className="mt-1 text-xs text-slate-500">{slot.course_code || 'Course code not set'}</p>
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {slot.start_time}–{slot.end_time}</span>
                            {slot.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {slot.room}</span>}
                          </div>
                          {slot.faculty_name && <p className="mt-2 text-xs text-slate-500">{slot.faculty_name}</p>}
                        </div>
                      )) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No timetable slots published.</p>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card><CardContent className="p-5 text-sm text-slate-600">Your role can view institution calendar events. A personal timetable view is not enabled for this role yet.</CardContent></Card>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-950">This month’s events</h2>
              <p className="text-sm text-slate-500">Published events visible to your account.</p>
            </div>
          </div>
          <Card>
            <CardContent className="divide-y divide-slate-100 p-0">
              {events.length ? events.map((event) => (
                <article key={event.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">{event.event_type}</span>
                  </div>
                  {event.description && <p className="mt-2 text-sm text-slate-600">{event.description}</p>}
                  <p className="mt-2 text-xs text-slate-500">{formatDate(event.start_at)} – {formatDate(event.end_at)}</p>
                </article>
              )) : <p className="p-5 text-sm text-slate-500">No published calendar events for this month.</p>}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
