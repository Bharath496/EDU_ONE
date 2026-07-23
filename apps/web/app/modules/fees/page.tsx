'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { IndianRupee, Search, Download, ChevronRight, Calendar, Clock, CheckCircle, AlertCircle, FileText, Banknote, Receipt } from 'lucide-react'

const FEE_RECORDS = [
  { id: '1', name: 'Arjun Kumar', regNo: '23CS001', feeType: 'Tuition Fee', amount: '₹45,000', dueDate: 'Jul 15, 2024', paidDate: 'Jul 12, 2024', status: 'paid', method: 'Online' },
  { id: '2', name: 'Priya Sharma', regNo: '23CS002', feeType: 'Hostel Fee', amount: '₹12,000', dueDate: 'Jul 20, 2024', paidDate: 'Jul 14, 2024', status: 'paid', method: 'UPI' },
  { id: '3', name: 'Rahul Verma', regNo: '23EC003', feeType: 'Tuition Fee', amount: '₹45,000', dueDate: 'Jul 15, 2024', paidDate: '-', status: 'pending', method: '-' },
  { id: '4', name: 'Sneha Patel', regNo: '23ME004', feeType: 'Library Fee', amount: '₹3,500', dueDate: 'Aug 15, 2024', paidDate: '-', status: 'upcoming', method: '-' },
  { id: '5', name: 'Vikram Singh', regNo: '23CS005', feeType: 'Tuition Fee', amount: '₹45,000', dueDate: 'Jul 15, 2024', paidDate: '-', status: 'overdue', method: '-' },
  { id: '6', name: 'Ananya Gupta', regNo: '23BT006', feeType: 'Exam Fee', amount: '₹5,000', dueDate: 'Sep 01, 2024', paidDate: '-', status: 'upcoming', method: '-' },
  { id: '7', name: 'Rohit Joshi', regNo: '23CS007', feeType: 'Tuition Fee', amount: '₹45,000', dueDate: 'Jul 15, 2024', paidDate: 'Jul 10, 2024', status: 'paid', method: 'DD' },
  { id: '8', name: 'Neha Kapoor', regNo: '23EC008', feeType: 'Transport Fee', amount: '₹6,000', dueDate: 'Aug 01, 2024', paidDate: '-', status: 'upcoming', method: '-' },
]

export default function FeesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = FEE_RECORDS.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.regNo.toLowerCase().includes(search.toLowerCase()) ||
    r.feeType.toLowerCase().includes(search.toLowerCase())
  )

  const collected = FEE_RECORDS.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseInt(r.amount.replace(/[₹,]/g, '')), 0)
  const pending = FEE_RECORDS.filter(r => r.status === 'pending' || r.status === 'overdue').reduce((sum, r) => sum + parseInt(r.amount.replace(/[₹,]/g, '')), 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Fee Payments</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button variant="primary" size="sm" className="gap-2"><Receipt className="w-4 h-4" /> Pay Now</Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Collected', value: `₹${collected.toLocaleString()}`, sub: 'This semester', icon: IndianRupee },
            { label: 'Pending Dues', value: `₹${pending.toLocaleString()}`, sub: 'Overdue & pending', icon: Clock },
            { label: 'Paid', value: FEE_RECORDS.filter(r => r.status === 'paid').length, sub: 'Students', icon: CheckCircle },
            { label: 'Overdue', value: FEE_RECORDS.filter(r => r.status === 'overdue').length, sub: 'Requires attention', icon: AlertCircle },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700"><stat.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by name, reg no, or fee type..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Fee Type</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Paid On</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900">{r.name}</p>
                            <p className="text-xs text-slate-500">{r.regNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.feeType}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-900">{r.amount}</td>
                      <td className="py-3 px-4 text-slate-600">{r.dueDate}</td>
                      <td className="py-3 px-4 text-slate-600">{r.paidDate}</td>
                      <td className="py-3 px-4">
                        <Badge variant={r.status === 'paid' ? 'success' : r.status === 'overdue' ? 'danger' : r.status === 'pending' ? 'warning' : 'secondary'} size="sm">{r.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.method}</td>
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