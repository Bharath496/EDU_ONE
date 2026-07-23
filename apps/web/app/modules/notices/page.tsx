'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { Megaphone, Plus, Search, ChevronRight, Calendar, Clock, Pin, Bell, MessageSquare, AlertCircle, Paperclip, Download, Eye } from 'lucide-react'

const NOTICES = [
  { id: '1', title: 'Semester Exam Schedule Released', content: 'The schedule for the semester exams has been published. Please check the academic portal for details.', author: 'Dean Academics', authorRole: 'College Admin', target: 'All Students, Faculty', priority: 'high', date: 'Jul 15, 2024', views: 1240, pinned: true },
  { id: '2', title: 'Cultural Fest Registrations Open', content: 'Annual cultural fest registrations are now open. Last date for registration is July 30th.', author: 'Cultural Committee', authorRole: 'Faculty', target: 'All Students', priority: 'medium', date: 'Jul 14, 2024', views: 890, pinned: false },
  { id: '3', title: 'Holiday Notice - Independence Day', content: 'The college will remain closed on August 15th on account of Independence Day.', author: 'Administration', authorRole: 'College Admin', target: 'Everyone', priority: 'low', date: 'Jul 12, 2024', views: 2100, pinned: true },
  { id: '4', title: 'Library Timings Extended', content: 'The library will remain open till 10 PM during exam season starting from next week.', author: 'Librarian', authorRole: 'Staff', target: 'All Students', priority: 'medium', date: 'Jul 10, 2024', views: 567, pinned: false },
  { id: '5', title: 'Urgent: Faculty Meeting Tomorrow', content: 'All faculty members are requested to attend an urgent meeting tomorrow at 3 PM in the conference hall.', author: 'Principal', authorRole: 'College Admin', target: 'Faculty', priority: 'urgent', date: 'Jul 09, 2024', views: 345, pinned: false },
]

export default function NoticesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filtered = NOTICES.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.author.toLowerCase().includes(search.toLowerCase()) ||
    n.target.toLowerCase().includes(search.toLowerCase())
  )

  const pinnedNotices = filtered.filter(n => n.pinned)
  const regularNotices = filtered.filter(n => !n.pinned)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Notices & Announcements</h1>
          </div>
          <Link href="/modules/notices/new">
            <Button variant="primary" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Create Notice</Button>
          </Link>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        {pinnedNotices.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" /> Pinned
            </h2>
            <div className="space-y-3">
              {pinnedNotices.map(notice => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Notices</h2>
          <div className="space-y-3">
            {regularNotices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NoticeCard({ notice }: { notice: typeof NOTICES[0] }) {
  return (
    <Card className={`hover:shadow-soft transition-shadow ${notice.pinned ? 'border-primary-200 bg-primary-50/30' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-900">{notice.title}</h3>
              {notice.priority === 'urgent' && <Badge variant="danger" size="sm" dot>Urgent</Badge>}
              {notice.priority === 'high' && <Badge variant="warning" size="sm">High</Badge>}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2">{notice.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1"><Bell className="w-3 h-3" /> {notice.author} ({notice.authorRole})</div>
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {notice.date}</div>
              <div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {notice.views}</div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Badge variant="secondary" size="sm">{notice.target}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}