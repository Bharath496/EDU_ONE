'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Send,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

type Tab = 'messages' | 'announcements' | 'contacts'

export default function CommunicationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const messages = useEduStore((state) => state.messages)
  const notices = useEduStore((state) => state.notices)
  const students = useEduStore((state) => state.students)
  const faculty = useEduStore((state) => state.faculty)
  const sendMessage = useEduStore((state) => state.sendMessage)
  const markMessageRead = useEduStore((state) => state.markMessageRead)

  const [tab, setTab] = useState<Tab>('messages')
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [form, setForm] = useState({
    recipient: 'Everyone',
    subject: '',
    body: '',
  })

  const visibleMessages = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return messages.filter((message) => {
      const roleVisible =
        user?.role === 'Student'
          ? ['Everyone', 'Students', user.name].includes(message.recipient)
          : user?.role === 'Parent'
            ? ['Everyone', 'Parents', user.name].includes(message.recipient)
            : true
      const matches =
        !needle ||
        message.sender.toLowerCase().includes(needle) ||
        message.subject.toLowerCase().includes(needle) ||
        message.body.toLowerCase().includes(needle)
      return roleVisible && matches
    })
  }, [messages, search, user])

  if (!isAuthenticated || !user) {
    router.push('/')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) return
    sendMessage({
      sender: user.name,
      senderRole: user.role,
      recipient: form.recipient,
      subject: form.subject.trim(),
      body: form.body.trim(),
    })
    setComposeOpen(false)
    setForm({ ...form, subject: '', body: '' })
  }

  const unread = visibleMessages.filter((item) => item.unread).length
  const contacts =
    user.role === 'Student' || user.role === 'Parent'
      ? faculty.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.designation,
          email: member.email,
        }))
      : [
          ...faculty.map((member) => ({ id: member.id, name: member.name, role: member.designation, email: member.email })),
          ...students.slice(0, 8).map((student) => ({ id: student.id, name: student.name, role: 'Student', email: student.email })),
        ]

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Communication</h1>
          <p className="mt-1 text-sm text-slate-500">
            Messages, announcements and contacts using the same local-first workspace.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4" />
          New message
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><MessageSquare className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Messages</p><p className="text-2xl font-bold text-slate-950">{visibleMessages.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Bell className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Unread</p><p className="text-2xl font-bold text-slate-950">{unread}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><UserRound className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Contacts</p><p className="text-2xl font-bold text-slate-950">{contacts.length}</p></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['messages', 'Messages'],
          ['announcements', 'Announcements'],
          ['contacts', 'Contacts'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-primary-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'messages' && (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Click a message to mark it read.</CardDescription>
            <div className="max-w-md pt-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" leftIcon={<Search className="h-4 w-4 text-slate-400" />} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => markMessageRead(message.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-slate-50 ${
                  message.unread ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={message.sender} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{message.sender}</p>
                      <Badge variant="secondary" size="sm">{message.senderRole}</Badge>
                      {message.unread && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">{message.subject}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{message.body}</p>
                    <p className="mt-2 text-xs text-slate-400">To {message.recipient} • {new Date(message.at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'announcements' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {notices
            .filter((notice) => user.role !== 'Student' && user.role !== 'Parent' ? true : notice.target !== 'Faculty')
            .map((notice) => (
              <Card key={notice.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{notice.title}</h3>
                    <Badge variant={notice.priority === 'urgent' ? 'danger' : notice.priority === 'high' ? 'warning' : 'secondary'} size="sm">{notice.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
                  <p className="mt-3 text-xs text-slate-400">{notice.author} • {notice.target}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center gap-4 p-5">
                <Avatar name={contact.name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{contact.name}</p>
                  <p className="text-sm text-slate-500">{contact.role}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400"><Mail className="h-3.5 w-3.5" />{contact.email}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New message"
        description="Messages stay inside this local portfolio workspace; no external provider is implied."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button><Button type="submit" form="message-form" className="gap-2"><Send className="h-4 w-4" />Send</Button></div>}
      >
        <form id="message-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Recipient</label>
            <select value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
              <option>Everyone</option>
              <option>Students</option>
              <option>Faculty</option>
              <option>Parents</option>
              {contacts.slice(0, 12).map((contact) => <option key={contact.id} value={contact.name}>{contact.name}</option>)}
            </select>
          </div>
          <Input label="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
