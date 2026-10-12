'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  Headphones,
  Plus,
  Search,
  TicketCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

const FAQS = [
  ['How do I pay fees?', 'Open Fees from the sidebar, review the scoped ledger, then use Pay demo on a pending fee record.'],
  ['How do I check attendance?', 'Open Attendance. Students and parents see only the active student profile, while authorized staff can manage class sessions.'],
  ['How do I submit an assignment?', 'Open Assignments and use Submit demo on a published assignment from the Student role.'],
  ['How do I access library availability?', 'Open Library to search books and see the current available-copy count.'],
  ['How do I download a report?', 'Authorized staff can open Reports and generate CSV files from the current workspace data.'],
  ['How do I move demo data to another browser?', 'College Admin can export a workspace backup from Settings and import it in another browser.'],
]

export default function HelpPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const tickets = useEduStore((state) => state.supportTickets)
  const createSupportTicket = useEduStore((state) => state.createSupportTicket)
  const updateStatus = useEduStore((state) => state.updateSupportTicketStatus)

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'General',
    priority: 'medium' as 'low' | 'medium' | 'high',
  })

  const canManageTickets = user?.role === 'College Admin' || user?.role === 'Staff'
  const visibleTickets =
    canManageTickets
      ? tickets
      : tickets.filter((ticket) => ticket.createdBy === user?.name)

  const filteredFaqs = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return FAQS.filter(([question, answer]) =>
      !needle || question.toLowerCase().includes(needle) || answer.toLowerCase().includes(needle)
    )
  }, [search])

  if (!isAuthenticated || !user) {
    router.push('/')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    createSupportTicket({
      title: form.title.trim(),
      category: form.category,
      createdBy: user.name,
      priority: form.priority,
    })
    setOpen(false)
    setForm({ ...form, title: '' })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Help & Support</h1>
          <p className="mt-1 text-sm text-slate-500">FAQs and persistent local support tickets for the portfolio demo.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create support ticket
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><TicketCheck className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Visible tickets</p><p className="text-2xl font-bold text-slate-950">{visibleTickets.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Clock3 className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Open</p><p className="text-2xl font-bold text-slate-950">{visibleTickets.filter((item) => item.status !== 'resolved').length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Resolved</p><p className="text-2xl font-bold text-slate-950">{visibleTickets.filter((item) => item.status === 'resolved').length}</p></div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CircleHelp className="h-5 w-5 text-primary-600" />FAQs</CardTitle>
            <CardDescription>Answers describe the actual EDU_ONE demo behavior.</CardDescription>
            <div className="pt-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search help" leftIcon={<Search className="h-4 w-4 text-slate-400" />} /></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredFaqs.map(([question, answer]) => (
              <details key={question} className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-slate-900">{question}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-primary-600" />Support tickets</CardTitle>
            <CardDescription>Local demo workflow. No external helpdesk service is connected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{ticket.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{ticket.category} • {ticket.createdBy} • {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'secondary'} size="sm">{ticket.priority}</Badge>
                    {canManageTickets ? (
                      <select
                        value={ticket.status}
                        onChange={(event) => updateStatus(ticket.id, event.target.value as typeof ticket.status)}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                      >
                        <option value="open">open</option>
                        <option value="in-progress">in-progress</option>
                        <option value="resolved">resolved</option>
                      </select>
                    ) : (
                      <Badge variant={ticket.status === 'resolved' ? 'success' : ticket.status === 'in-progress' ? 'primary' : 'secondary'} size="sm">{ticket.status}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!visibleTickets.length && <p className="py-8 text-center text-sm text-slate-400">No support tickets for this account.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Contact</CardTitle><CardDescription>Demo support address: support@eduone.demo. It is a placeholder identifier, not an externally monitored mailbox.</CardDescription></CardHeader>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create support ticket" description="The ticket will persist in this browser workspace." footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="ticket-form">Create ticket</Button></div>}>
        <form id="ticket-form" onSubmit={submit} className="space-y-4">
          <Input label="Issue title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>General</option><option>Academics</option><option>Attendance</option><option>Fees</option><option>Library</option><option>Technical</option></select></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as typeof form.priority })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
