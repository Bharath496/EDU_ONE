'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { GraduationCap, Search, Filter, Plus, ChevronRight, Download, Mail, Phone, Calendar, BookOpen, MoreHorizontal, UserCheck } from 'lucide-react'

const STUDENTS = [
  { id: '1', name: 'Arjun Kumar', regNo: '23CS001', department: 'Computer Science', semester: 3, batch: '2023-27', email: 'arjun.k@psgct.edu', phone: '+91 98765 40001', attendance: 94, cgpa: 8.7, status: 'active', avatar: '' },
  { id: '2', name: 'Priya Sharma', regNo: '23CS002', department: 'Computer Science', semester: 3, batch: '2023-27', email: 'priya.s@psgct.edu', phone: '+91 98765 40002', attendance: 92, cgpa: 9.1, status: 'active', avatar: '' },
  { id: '3', name: 'Rahul Verma', regNo: '23EC003', department: 'Electronics', semester: 3, batch: '2023-27', email: 'rahul.v@psgct.edu', phone: '+91 98765 40003', attendance: 78, cgpa: 7.2, status: 'active', avatar: '' },
  { id: '4', name: 'Sneha Patel', regNo: '23ME004', department: 'Mechanical', semester: 5, batch: '2022-26', email: 'sneha.p@psgct.edu', phone: '+91 98765 40004', attendance: 96, cgpa: 8.9, status: 'active', avatar: '' },
  { id: '5', name: 'Vikram Singh', regNo: '23CS005', department: 'Computer Science', semester: 3, batch: '2023-27', email: 'vikram.s@psgct.edu', phone: '+91 98765 40005', attendance: 45, cgpa: 5.8, status: 'inactive', avatar: '' },
  { id: '6', name: 'Ananya Gupta', regNo: '23BT006', department: 'Biotech', semester: 3, batch: '2023-27', email: 'ananya.g@psgct.edu', phone: '+91 98765 40006', attendance: 88, cgpa: 8.4, status: 'active', avatar: '' },
  { id: '7', name: 'Rohit Joshi', regNo: '23CS007', department: 'Computer Science', semester: 5, batch: '2022-26', email: 'rohit.j@psgct.edu', phone: '+91 98765 40007', attendance: 91, cgpa: 8.2, status: 'active', avatar: '' },
  { id: '8', name: 'Neha Kapoor', regNo: '23EC008', department: 'Electronics', semester: 3, batch: '2023-27', email: 'neha.k@psgct.edu', phone: '+91 98765 40008', attendance: 85, cgpa: 7.9, status: 'active', avatar: '' },
]

export default function StudentsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('All')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = STUDENTS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNo.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = filterDept === 'All' || s.department === filterDept
    return matchesSearch && matchesDept
  })

  const departments = [...new Set(STUDENTS.map(s => s.department))]

  const activeCount = STUDENTS.filter(s => s.status === 'active').length
  const avgAttendance = Math.round(STUDENTS.reduce((sum, s) => sum + s.attendance, 0) / STUDENTS.length)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Students</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-700"><GraduationCap className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{STUDENTS.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-green-100 text-green-700"><UserCheck className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-700"><Calendar className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-500">Avg Attendance</p>
                <p className="text-2xl font-bold text-slate-900">{avgAttendance}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search by name, reg no, or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="flex gap-2">
            {['All', ...departments].map(d => (
              <button key={d} onClick={() => setFilterDept(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterDept === d ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{d === 'All' ? 'All' : d}</button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Reg No</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Department</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Sem</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Attendance</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">CGPA</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="w-10 py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{s.regNo}</td>
                      <td className="py-3 px-4 text-slate-600">{s.department}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.semester}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.attendance >= 75 ? 'bg-green-500' : s.attendance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.attendance}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${s.attendance >= 75 ? 'text-green-600' : s.attendance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{s.attendance}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-sm font-medium ${s.cgpa >= 8 ? 'text-green-600' : s.cgpa >= 6 ? 'text-amber-600' : 'text-red-600'}`}>{s.cgpa}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={s.status === 'active' ? 'success' : 'danger'} size="sm">{s.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No students found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}