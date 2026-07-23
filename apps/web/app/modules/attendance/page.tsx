'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { CalendarCheck, Search, Filter, ChevronRight, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Download, ChevronLeft } from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const STUDENTS = [
  { id: '1', name: 'Arjun Kumar', regNo: '23CS001', attendance: [true, true, true, false, true] },
  { id: '2', name: 'Priya Sharma', regNo: '23CS002', attendance: [true, true, true, true, true] },
  { id: '3', name: 'Rahul Verma', regNo: '23EC003', attendance: [false, true, false, true, true] },
  { id: '4', name: 'Sneha Patel', regNo: '23ME004', attendance: [true, true, true, true, false] },
  { id: '5', name: 'Vikram Singh', regNo: '23CS005', attendance: [false, false, true, false, false] },
  { id: '6', name: 'Ananya Gupta', regNo: '23BT006', attendance: [true, true, false, true, true] },
  { id: '7', name: 'Rohit Joshi', regNo: '23CS007', attendance: [true, true, true, true, true] },
  { id: '8', name: 'Neha Kapoor', regNo: '23EC008', attendance: [true, false, true, true, false] },
]

export default function AttendancePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState('Jul 15 - Jul 19, 2024')
  const [selectedCourse, setSelectedCourse] = useState('Data Structures (CSE-301)')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const totalPresent = STUDENTS.reduce((sum, s) => sum + s.attendance.filter(a => a).length, 0)
  const totalClasses = STUDENTS.length * WEEKDAYS.length
  const overallPercent = Math.round((totalPresent / totalClasses) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button variant="primary" size="sm">Mark Today</Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Data Structures (CSE-301)</option>
              <option>Database Systems (CSE-302)</option>
              <option>Operating Systems (CSE-303)</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm">
              <button className="p-0.5 rounded hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-medium text-slate-900 min-w-40 text-center">{currentWeek}</span>
              <button className="p-0.5 rounded hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-slate-600">Present</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-slate-600">Absent</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall Attendance', value: `${overallPercent}%`, icon: CalendarCheck, color: 'blue' },
            { label: 'Total Classes', value: totalClasses, icon: Calendar, color: 'purple' },
            { label: 'Present', value: totalPresent, icon: CheckCircle, color: 'green' },
            { label: 'Absent', value: totalClasses - totalPresent, icon: XCircle, color: 'red' },
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Weekly Attendance Sheet</CardTitle>
            <CardDescription>{selectedCourse} • Week of {currentWeek}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 font-medium text-slate-500 w-10">#</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">Student</th>
                    <th className="text-left py-3 px-3 font-medium text-slate-500">Reg No</th>
                    {WEEKDAYS.map(day => <th key={day} className="text-center py-3 px-3 font-medium text-slate-500">{day}</th>)}
                    <th className="text-center py-3 px-3 font-medium text-slate-500">%</th>
                    <th className="text-center py-3 px-3 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map((s, i) => {
                    const presentCount = s.attendance.filter(a => a).length
                    const percent = Math.round((presentCount / WEEKDAYS.length) * 100)
                    return (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.name} size="sm" />
                            <span className="font-medium text-slate-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs font-mono text-slate-600">{s.regNo}</td>
                        {s.attendance.map((present, dayIdx) => (
                          <td key={dayIdx} className="py-2.5 px-3 text-center">
                            {present ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-medium ${percent >= 75 ? 'text-green-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{percent}%</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={percent >= 75 ? 'success' : percent >= 50 ? 'warning' : 'danger'} size="sm">
                            {percent >= 75 ? 'Good' : percent >= 50 ? 'Average' : 'Poor'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}