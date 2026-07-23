'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/lib/auth-store'
import { Award, Search, Download, TrendingUp, TrendingDown, BookOpen, BarChart3, ChevronDown } from 'lucide-react'

const MARKS_DATA = [
  { id: '1', name: 'Arjun Kumar', regNo: '23CS001', course: 'Data Structures', internal: 42, external: 38, total: 80, grade: 'A', rank: 3 },
  { id: '2', name: 'Priya Sharma', regNo: '23CS002', course: 'Data Structures', internal: 45, external: 42, total: 87, grade: 'A+', rank: 1 },
  { id: '3', name: 'Rahul Verma', regNo: '23EC003', course: 'Data Structures', internal: 32, external: 28, total: 60, grade: 'B', rank: 8 },
  { id: '4', name: 'Sneha Patel', regNo: '23ME004', course: 'Data Structures', internal: 40, external: 36, total: 76, grade: 'A', rank: 4 },
  { id: '5', name: 'Ananya Gupta', regNo: '23BT006', course: 'Data Structures', internal: 38, external: 40, total: 78, grade: 'A', rank: 5 },
  { id: '6', name: 'Rohit Joshi', regNo: '23CS007', course: 'Data Structures', internal: 44, external: 41, total: 85, grade: 'A+', rank: 2 },
  { id: '7', name: 'Neha Kapoor', regNo: '23EC008', course: 'Data Structures', internal: 28, external: 25, total: 53, grade: 'C', rank: 12 },
  { id: '8', name: 'Vikram Singh', regNo: '23CS005', course: 'Data Structures', internal: 15, external: 20, total: 35, grade: 'D', rank: 15 },
]

export default function MarksPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('Data Structures (CSE-301)')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = MARKS_DATA.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.regNo.toLowerCase().includes(search.toLowerCase())
  )

  const avg = Math.round(filtered.reduce((s, m) => s + m.total, 0) / filtered.length)
  const topScore = Math.max(...filtered.map(m => m.total))
  const passCount = filtered.filter(m => m.total >= 40).length

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Marks & Grades</h1>
          </div>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <select value={course} onChange={e => setCourse(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Data Structures (CSE-301)</option>
            <option>Database Systems (CSE-302)</option>
            <option>Operating Systems (CSE-303)</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Class Average', value: avg, suffix: '%', icon: BarChart3, color: 'blue' },
            { label: 'Highest Score', value: topScore, suffix: '%', icon: TrendingUp, color: 'green' },
            { label: 'Pass Count', value: passCount, suffix: `/${filtered.length}`, icon: Award, color: 'purple' },
            { label: 'Pass Rate', value: Math.round((passCount / filtered.length) * 100), suffix: '%', icon: BookOpen, color: 'amber' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700"><stat.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}<span className="text-sm font-normal text-slate-400">{stat.suffix}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Reg No</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Internal</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">External</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Total</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Grade</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a, b) => a.rank - b.rank).map(s => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size="sm" />
                          <span className="font-medium text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{s.regNo}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.internal}/50</td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.external}/50</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{s.total}/100</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={s.grade === 'A+' || s.grade === 'A' ? 'success' : s.grade === 'B' ? 'primary' : s.grade === 'C' ? 'warning' : 'danger'} size="sm">{s.grade}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{s.rank}</td>
                      <td className="py-3 px-4">
                        <Badge variant={s.total >= 40 ? 'success' : 'danger'} size="sm">{s.total >= 40 ? 'Pass' : 'Fail'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}