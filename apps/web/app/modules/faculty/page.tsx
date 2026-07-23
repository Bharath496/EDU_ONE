'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { UserCheck, Search, Plus, ChevronRight, Download, Mail, Phone, BookOpen, GraduationCap, MoreHorizontal } from 'lucide-react'

const FACULTY = [
  { id: '1', name: 'Prof. Meera Patel', empId: 'FAC001', department: 'Computer Science', designation: 'Professor', email: 'meera.p@srmit.edu', phone: '+91 98765 10001', courses: 3, students: 120, experience: '12 yrs', qualification: 'Ph.D - IIT Madras', status: 'active' },
  { id: '2', name: 'Dr. S. Ramesh', empId: 'FAC002', department: 'Electronics', designation: 'Associate Professor', email: 'ramesh.s@srmit.edu', phone: '+91 98765 10002', courses: 2, students: 85, experience: '8 yrs', qualification: 'Ph.D - NIT Trichy', status: 'active' },
  { id: '3', name: 'Prof. Anjali Desai', empId: 'FAC003', department: 'Mechanical', designation: 'Assistant Professor', email: 'anjali.d@srmit.edu', phone: '+91 98765 10003', courses: 4, students: 150, experience: '6 yrs', qualification: 'M.Tech - IIT Bombay', status: 'active' },
  { id: '4', name: 'Dr. K. Venkatesh', empId: 'FAC004', department: 'Computer Science', designation: 'Head of Department', email: 'venkatesh.k@srmit.edu', phone: '+91 98765 10004', courses: 2, students: 60, experience: '15 yrs', qualification: 'Ph.D - IISC Bangalore', status: 'active' },
  { id: '5', name: 'Prof. Neha Gupta', empId: 'FAC005', department: 'Mathematics', designation: 'Assistant Professor', email: 'neha.g@srmit.edu', phone: '+91 98765 10005', courses: 5, students: 200, experience: '4 yrs', qualification: 'M.Sc - DU', status: 'inactive' },
  { id: '6', name: 'Dr. Ravi Kumar', empId: 'FAC006', department: 'Physics', designation: 'Professor', email: 'ravi.k@srmit.edu', phone: '+91 98765 10006', courses: 3, students: 110, experience: '10 yrs', qualification: 'Ph.D - IIT Kanpur', status: 'active' },
]

export default function FacultyPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = FACULTY.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase()) ||
    f.designation.toLowerCase().includes(search.toLowerCase()) ||
    f.empId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Faculty</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button variant="primary" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Faculty</Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Faculty', value: FACULTY.length, icon: UserCheck, color: 'blue' },
            { label: 'Active', value: FACULTY.filter(f => f.status === 'active').length, icon: UserCheck, color: 'green' },
            { label: 'Departments', value: [...new Set(FACULTY.map(f => f.department))].length, icon: BookOpen, color: 'purple' },
            { label: 'Total Courses', value: FACULTY.reduce((sum, f) => sum + f.courses, 0), icon: GraduationCap, color: 'amber' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search faculty by name, department, or designation..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => (
            <Card key={f.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.name} size="md" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{f.name}</h3>
                      <p className="text-sm text-slate-500">{f.designation}</p>
                    </div>
                  </div>
                  <Badge variant={f.status === 'active' ? 'success' : 'secondary'} size="sm">{f.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {f.email}</div>
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {f.department} • {f.empId}</div>
                  <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {f.qualification}</div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
                  <div><span className="font-medium text-slate-900">{f.courses}</span> <span className="text-slate-500">Courses</span></div>
                  <div><span className="font-medium text-slate-900">{f.students}</span> <span className="text-slate-500">Students</span></div>
                  <div><span className="font-medium text-slate-900">{f.experience}</span> <span className="text-slate-500">Exp</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}