'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { Bell, AlertCircle, CheckCircle, Clock, Calendar, Award, IndianRupee, UserCheck, MessageSquare, Filter, CheckCheck } from 'lucide-react'

const ALERTS = [
  { id: '1', type: 'attendance', title: 'Low Attendance Warning', desc: 'Arjun has 72% attendance in Mathematics - below the 75% threshold', date: 'Jul 15, 2024', time: '10:30 AM', severity: 'high', read: false },
  { id: '2', type: 'fee', title: 'Fee Payment Due', desc: 'Tuition fee of ₹45,000 for Semester 3 is due in 5 days', date: 'Jul 14, 2024', time: '09:00 AM', severity: 'high', read: false },
  { id: '3', type: 'grade', title: 'Grade Published', desc: 'Mid-term exam results for Data Structures are now available', date: 'Jul 13, 2024', time: '02:15 PM', severity: 'medium', read: false },
  { id: '4', type: 'event', title: 'Parent-Teacher Meeting', desc: 'PTM scheduled for July 25th from 9 AM to 4 PM', date: 'Jul 12, 2024', time: '11:00 AM', severity: 'medium', read: true },
  { id: '5', type: 'notice', title: 'College Holiday', desc: 'College will remain closed on Aug 15th for Independence Day', date: 'Jul 11, 2024', time: '04:00 PM', severity: 'low', read: true },
  { id: '6', type: 'achievement', title: 'Academic Achievement', desc: 'Priya has been awarded Best Student of the Year for academic excellence', date: 'Jul 10, 2024', time: '03:30 PM', severity: 'low', read: true },
]

export default function AlertsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [filter, setFilter] = useState('all')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = filter === 'all' ? ALERTS : filter === 'unread' ? ALERTS.filter(a => !a.read) : ALERTS.filter(a => a.severity === filter)

  const unreadCount = ALERTS.filter(a => !a.read).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Alerts</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2"><CheckCheck className="w-4 h-4" /> Mark All Read</Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{unreadCount}</span> unread alerts
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
              { id: 'low', label: 'Low' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(alert => (
            <Card key={alert.id} className={`hover:shadow-soft transition-shadow ${!alert.read ? 'border-l-4 border-l-primary-500 bg-primary-50/20' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {alert.type === 'attendance' ? <UserCheck className="w-5 h-5" /> :
                     alert.type === 'fee' ? <IndianRupee className="w-5 h-5" /> :
                     alert.type === 'grade' || alert.type === 'achievement' ? <Award className="w-5 h-5" /> :
                     alert.type === 'event' ? <Calendar className="w-5 h-5" /> :
                     <MessageSquare className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                          {!alert.read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{alert.desc}</p>
                      </div>
                      <Badge variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'secondary'} size="sm" className="flex-shrink-0">{alert.severity}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {alert.date}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.time}</div>
                    </div>
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