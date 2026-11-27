'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

export default function InstitutionalFinancePage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const [students, setStudents] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [studentId, setStudentId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [feeType, setFeeType] = useState('Tuition')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [studentResponse, invoiceResponse, paymentResponse] = await Promise.all([
        api.getInstitutionalStudents({ limit: 200 }),
        api.getInstitutionalFees({ limit: 100 }),
        api.getPendingFeePayments(),
      ])
      setStudents(studentResponse.items || [])
      setInvoices(invoiceResponse.items || [])
      setPending(paymentResponse || [])
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load finance records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Accounts', 'College Admin'].includes(user.role)) { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const createInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.createFeeInvoice({
        student_profile_id: studentId,
        invoice_number: invoiceNumber,
        fee_type: feeType,
        description: description || undefined,
        amount: Number(amount),
        due_date: dueDate,
      })
      setSuccess('Fee invoice created.')
      setInvoiceNumber(''); setDescription(''); setAmount(''); setDueDate('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create the fee invoice.')
    } finally {
      setSaving(false)
    }
  }

  const verify = async (paymentId: string) => {
    setError(''); setSuccess('')
    try {
      await api.verifyFeePayment(paymentId)
      setSuccess('Payment verified and invoice balance updated.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not verify this payment.')
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading finance workspace...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Finance and fee management</h1><p className="text-sm text-slate-500">Pending payment references require manual verification. No payment gateway is connected.</p></div></header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[390px_1fr]">
        <Card><CardContent className="p-5"><div className="mb-5 flex items-center gap-2 font-semibold"><IndianRupee className="h-4 w-4" /> Create fee invoice</div>
          <form onSubmit={createInvoice} className="space-y-3">
            <label className="block text-sm">Student<select required value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose student</option>{students.map(item => <option key={item.id} value={item.id}>{item.registration_number} · {item.name}</option>)}</select></label>
            <label className="block text-sm">Invoice number<input required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Fee type<input required value={feeType} onChange={e => setFeeType(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Description<input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Amount (₹)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Due date<input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <Button type="submit" disabled={saving || !studentId} className="w-full">{saving ? 'Creating...' : 'Create invoice'}</Button>
          </form>
        </CardContent></Card>
        <div className="space-y-6">
          {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
          {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
          <Card><CardContent className="p-5"><h2 className="font-semibold">Pending payment verification ({pending.length})</h2><div className="mt-4 space-y-4">{pending.map(item => <div key={item.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center"><div><p className="font-medium">{item.student_name} · {item.registration_number}</p><p className="text-sm text-slate-600">{item.invoice_number} · {item.fee_type} · ₹{item.amount}</p><p className="text-xs text-slate-500">{item.method} · Ref: {item.payment_reference || 'Not supplied'}</p></div><Button size="sm" onClick={() => void verify(item.id)}>Verify payment</Button></div>)}{pending.length === 0 && <p className="text-sm text-slate-500">No pending payment requests.</p>}</div></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="font-semibold">Recent fee invoices ({invoices.length})</h2><div className="mt-4 space-y-3">{invoices.slice(0, 20).map(item => <div key={item.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><div><p className="font-medium">{item.invoice_number} · {item.fee_type}</p><p className="text-xs text-slate-500">{item.student_profile_id}</p></div><span className="text-slate-600">₹{item.outstanding_amount} · {item.status}</span></div>)}</div></CardContent></Card>
        </div>
      </div>
    </main>
  )
}
