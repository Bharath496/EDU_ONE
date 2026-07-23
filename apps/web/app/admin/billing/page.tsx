'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { IndianRupee, TrendingUp, Download, ChevronRight, Search, Filter, Building2, Users, Calendar, Clock, AlertCircle, CheckCircle, FileText, Receipt, Banknote } from 'lucide-react'

const RECENT_PAYMENTS = [
  { id: 'PAY-001', student: 'Arjun Kumar', regNo: '23CS001', college: 'PSG College of Technology', amount: '₹45,000', feeType: 'Tuition Fee', date: 'Jul 15, 2024', status: 'completed', method: 'Online' },
  { id: 'PAY-002', student: 'Priya Sharma', regNo: '23CS002', college: 'PSG College of Technology', amount: '₹12,000', feeType: 'Hostel Fee', date: 'Jul 14, 2024', status: 'completed', method: 'UPI' },
  { id: 'PAY-003', student: 'Rahul Verma', regNo: '23EC003', college: 'SRM Institute', amount: '₹45,000', feeType: 'Tuition Fee', date: 'Jul 13, 2024', status: 'pending', method: 'Cheque' },
  { id: 'PAY-004', student: 'Sneha Patel', regNo: '23ME004', college: 'VIT University', amount: '₹8,500', feeType: 'Library Fee', date: 'Jul 12, 2024', status: 'completed', method: 'Online' },
  { id: 'PAY-005', student: 'Vikram Singh', regNo: '23CS005', college: 'Christ University', amount: '₹45,000', feeType: 'Tuition Fee', date: 'Jul 10, 2024', status: 'overdue', method: '-' },
  { id: 'PAY-006', student: 'Ananya Gupta', regNo: '23BT006', college: 'BITS Pilani', amount: '₹25,000', feeType: 'Exam Fee', date: 'Jul 08, 2024', status: 'completed', method: 'DD' },
]

const FEE_STATS = [
  { label: 'Total Collected', value: '₹12,45,000', change: '+15% vs last month', icon: IndianRupee, color: 'green', sub: 'This month' },
  { label: 'Pending Dues', value: '₹2,30,000', change: '23 students', icon: Clock, color: 'amber', sub: 'Overdue' },
  { label: 'Collection Rate', value: '87%', change: '+5% vs last month', icon: TrendingUp, color: 'blue', sub: 'Overall' },
  { label: 'Transactions', value: '1,234', change: '+189 this month', icon: Receipt, color: 'purple', sub: 'Total' },
]

const FEE_STRUCTURE = [
  { type: 'Tuition Fee', amount: '₹45,000', frequency: 'Semester', department: 'All', dueDate: 'Jul 15, 2024' },
  { type: 'Hostel Fee', amount: '₹12,000', frequency: 'Semester', department: 'Hostel Students', dueDate: 'Jul 20, 2024' },
  { type: 'Transport Fee', amount: '₹6,000', frequency: 'Quarterly', department: 'Transport Users', dueDate: 'Aug 01, 2024' },
  { type: 'Library Fee', amount: '₹3,500', frequency: 'Annual', department: 'All', dueDate: 'Aug 15, 2024' },
  { type: 'Exam Fee', amount: '₹5,000', frequency: 'Per Exam', department: 'Final Year', dueDate: 'Sep 01, 2024' },
  { type: 'Laboratory Fee', amount: '₹4,000', frequency: 'Semester', department: 'Science Streams', dueDate: 'Sep 10, 2024' },
]

export default function FeeManagementPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const filtered = RECENT_PAYMENTS.filter(p =>
    p.student.toLowerCase().includes(search.toLowerCase()) ||
    p.regNo.toLowerCase().includes(search.toLowerCase()) ||
    p.college.toLowerCase().includes(search.toLowerCase()) ||
    p.feeType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Fee Management</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Fee Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Invoice
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {FEE_STATS.map((stat, i) => (
            <Card key={i} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Recent Payments</CardTitle>
                  <CardDescription>Latest fee transactions across all colleges</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-48 pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-2 font-medium text-slate-500">ID</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Student</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">College</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Type</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-500">Amount</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Date</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-2 text-xs font-mono text-slate-500">{p.id}</td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-slate-900">{p.student}</p>
                              <p className="text-xs text-slate-500">{p.regNo}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-slate-600">{p.college}</td>
                          <td className="py-3 px-2 text-slate-600">{p.feeType}</td>
                          <td className="py-3 px-2 text-right font-medium text-slate-900">{p.amount}</td>
                          <td className="py-3 px-2 text-slate-600">{p.date}</td>
                          <td className="py-3 px-2">
                            <Badge variant={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'} size="sm">
                              {p.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                              {p.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Fee Structure</CardTitle>
                <CardDescription>Standard fee types across institutions</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {FEE_STRUCTURE.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{fee.type}</p>
                      <p className="text-xs text-slate-500">{fee.department} • {fee.frequency}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{fee.amount}</p>
                      <p className="text-xs text-slate-400">Due: {fee.dueDate}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Collection breakdown this month</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {[
                  { method: 'Online Transfer', count: 456, amount: '₹8,50,000', percentage: 68 },
                  { method: 'UPI', count: 234, amount: '₹2,30,000', percentage: 18 },
                  { method: 'Cheque', count: 89, amount: '₹1,20,000', percentage: 10 },
                  { method: 'Cash/DD', count: 45, amount: '₹45,000', percentage: 4 },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{m.method}</span>
                      <div className="text-right">
                        <span className="font-medium text-slate-900">{m.amount}</span>
                        <span className="text-slate-400 ml-2">({m.percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${m.percentage}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{m.count} transactions</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}