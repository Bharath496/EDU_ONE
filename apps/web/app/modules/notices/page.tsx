'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Calendar,
  Eye,
  Megaphone,
  Pin,
  Plus,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

export default function NoticesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const notices = useEduStore((state) => state.notices)
  const publishNotice = useEduStore((state) => state.publishNotice)
  const toggleNoticePin = useEduStore((state) => state.toggleNoticePin)

  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('All')
  const [open, setOpen] = useState(false)
  const canPublish = user?.role === 'College Admin' || user?.role === 'Faculty' || user?.role === 'Staff'
  const visibleNotices =
    user?.role === 'Student' || user?.role === 'Parent'
      ? notices.filter((notice) => notice.target !== 'Faculty')
      : notices
  const [form, setForm] = useState({
    title: '',
    content: '',
    author: user?.name ?? 'College Admin',
    target: 'Everyone',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    pinned: false,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return visibleNotices.filter((notice) => {
      const matchesSearch =
        !needle ||
        notice.title.toLowerCase().includes(needle) ||
        notice.content.toLowerCase().includes(needle) ||
        notice.author.toLowerCase().includes(needle)
      const matchesPriority = priority === 'All' || notice.priority === priority.toLowerCase()
      return matchesSearch && matchesPriority
    })
  }, [priority, search, visibleNotices])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canPublish || !form.title.trim() || !form.content.trim()) return
    publishNotice({
      ...form,
      author: form.author || user?.name || 'College Admin',
      title: form.title.trim(),
      content: form.content.trim(),
    })
    setOpen(false)
    setForm({ ...form, title: '', content: '', pinned: false })
  }

  const pinned = filtered.filter((item) => item.pinned)
  const regular = filtered.filter((item) => !item.pinned)

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Notices & Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canPublish
              ? 'Publish, pin and filter institution updates with persistent local demo data.'
              : 'Read announcements relevant to the current student or parent workspace.'}
          </p>
        </div>
        {canPublish && (
          <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Publish notice
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notices"
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option>All</option>
            <option>Urgent</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </CardContent>
      </Card>

      {pinned.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            <Pin className="h-4 w-4" />
            Pinned
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {pinned.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} onPin={() => toggleNoticePin(notice.id)} canPin={canPublish} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Recent notices</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {regular.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onPin={() => toggleNoticePin(notice.id)} canPin={canPublish} />
          ))}
        </div>
      </section>

      {!filtered.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-800">No matching notices</p>
        </div>
      )}

      <Modal
        open={canPublish && open}
        onClose={() => setOpen(false)}
        title="Publish notice"
        description="Create a realistic demo announcement. No server or paid messaging provider is required."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="notice-form">Publish</Button>
          </div>
        }
      >
        <form id="notice-form" onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Audience</label>
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option>Everyone</option>
                <option>All Students</option>
                <option>Students & Faculty</option>
                <option>Faculty</option>
                <option>Parents</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            Pin this notice
          </label>
        </form>
      </Modal>
    </div>
  )
}

function NoticeCard({
  notice,
  onPin,
  canPin,
}: {
  notice: ReturnType<typeof useEduStore.getState>['notices'][number]
  onPin: () => void
  canPin: boolean
}) {
  const priorityVariant = notice.priority === 'urgent'
    ? 'danger'
    : notice.priority === 'high'
      ? 'warning'
      : notice.priority === 'medium'
        ? 'primary'
        : 'secondary'

  return (
    <Card className={notice.pinned ? 'border-primary-200 bg-primary-50/30' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{notice.title}</h3>
              <Badge variant={priorityVariant} size="sm">{notice.priority}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Bell className="h-3.5 w-3.5" />{notice.author}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(notice.publishedAt).toLocaleDateString('en-IN')}</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{notice.views}</span>
              <Badge variant="outline" size="sm">{notice.target}</Badge>
            </div>
          </div>
          {canPin && (
            <button
              onClick={onPin}
              className={`rounded-xl p-2 transition-colors ${notice.pinned ? 'bg-primary-100 text-primary-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
              aria-label={notice.pinned ? 'Unpin notice' : 'Pin notice'}
            >
              <Pin className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
