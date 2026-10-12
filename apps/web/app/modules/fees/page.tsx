'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Clock3,
  Download,
  IndianRupee,
  ReceiptText,
  Search,
  TriangleAlert,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

function downloadFees(rows: Array<{
  name: string
  regNo: string
  feeType: string
  amount: number
  dueDate: string
  paidDate?: string
  status: string
  method?: string
}>) {
  const csv = [
    ['Student', 'Register No', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status', 'Method'],
    ...rows.map((row) => [
      row.name,
      row.regNo,
      row.feeType,
      row.amount,
      row.dueDate,
      row.paidDate ?? '',
      row.status,
      row.method ?? '',
    ]),
  ]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'eduone-fees.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function FeesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const students = useEduStore((state) => state.students)
  const fees = useEduStore((state) => state.fees)
  const markFeePaid = useEduStore((state) => state.markFeePaid)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const canManage = user?.role === 'College Admin'
  const canPay = canManage || user?.role === 'Student' || user?.role === 'Parent'
  const matchedStudent =
    students.find((student) => student.name.toLowerCase() === user?.name.toLowerCase()) ??
    students[0]
  const visibleFees = canManage
    ? fees
    : fees.filter((fee) => fee.studentId === matchedStudent?.id)

  const enriched = visibleFees.map((fee) => {
    const student = students.find((item) => item.id === fee.studentId)
    return {
      ...fee,
      name: student?.name ?? 'Unknown student',
      regNo: student?.regNo ?? '-',
    }
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return enriched.filter((row) => {
      const matchesSearch =
        !needle ||
        row.name.toLowerCase().includes(needle) ||
        row.regNo.toLowerCase().includes(needle) ||
        row.feeType.toLowerCase().includes(needle)
      const matchesStatus = status === 'All' || row.status === status.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [enriched, search, status])

  const collected = visibleFees.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0)
  const pending = visibleFees.filter((item) => item.status === 'pending' || item.status === 'overdue').reduce((sum, item) => sum + item.amount, 0)
  const overdue = visibleFees.filter((item) => item.status === 'overdue').length
  const collectionRate = visibleFees.length ? Math.round((visibleFees.filter((item) => item.status === 'paid').length / visibleFees.length) * 100) : 0

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Fee Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManage
              ? 'Track institution dues, simulate payment completion, and export the current ledger.'
              : 'View the current student fee ledger and complete demo payments.'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadFees(filtered)}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Collected', value: `₹${collected.toLocaleString('en-IN')}`, icon: IndianRupee, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending dues', value: `₹${pending.toLocaleString('en-IN')}`, icon: Clock3, cls: 'bg-amber-50 text-amber-700' },
          { label: 'Collection rate', value: `${collectionRate}%`, icon: CheckCircle2, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Overdue records', value: overdue, icon: TriangleAlert, cls: 'bg-red-50 text-red-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, register number or fee type"
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option>All</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Upcoming</option>
            <option>Overdue</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Fee type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Paid on</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{row.name}</p>
                          <p className="font-mono text-xs text-slate-500">{row.regNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.feeType}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-4 text-slate-600">{row.dueDate}</td>
                    <td className="px-4 py-4 text-slate-600">{row.paidDate ?? '-'}</td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'danger' : row.status === 'pending' ? 'warning' : 'secondary'}
                        size="sm"
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.method ?? '-'}</td>
                    <td className="px-4 py-4 text-right">
                      {row.status !== 'paid' && canPay ? (
                        <Button size="sm" variant="outline" className="gap-2" onClick={() => markFeePaid(row.id, user?.role === 'College Admin' ? 'Admin Demo Entry' : 'Demo UPI')}>
                          <ReceiptText className="h-4 w-4" />
                          {user?.role === 'College Admin' ? 'Mark paid' : 'Pay demo'}
                        </Button>
                      ) : row.status === 'paid' ? (
                        <span className="text-xs font-medium text-emerald-700">Completed</span>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
