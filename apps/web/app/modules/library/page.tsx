'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { Library, Search, Plus, ChevronRight, Download, BookOpen, User, Calendar, Clock, AlertTriangle, Bookmark } from 'lucide-react'

const BOOKS = [
  { id: '1', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', total: 10, available: 7, location: 'CS-A3' },
  { id: '2', title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-0078022159', category: 'Computer Science', total: 8, available: 4, location: 'CS-B2' },
  { id: '3', title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '978-1118063330', category: 'Computer Science', total: 12, available: 9, location: 'CS-A5' },
  { id: '4', title: 'Engineering Mathematics', author: 'B.S. Grewal', isbn: '978-8174092155', category: 'Mathematics', total: 15, available: 11, location: 'MA-C1' },
  { id: '5', title: 'Fundamentals of Physics', author: 'Halliday Resnick', isbn: '978-1118230718', category: 'Physics', total: 6, available: 2, location: 'PH-D2' },
  { id: '6', title: 'Organic Chemistry', author: 'Morrison & Boyd', isbn: '978-0134042282', category: 'Chemistry', total: 5, available: 5, location: 'CH-E1' },
]

const RECENT_ISSUES = [
  { id: '1', book: 'Introduction to Algorithms', student: 'Arjun Kumar', regNo: '23CS001', issued: 'Jul 10, 2024', due: 'Jul 24, 2024', status: 'issued' },
  { id: '2', book: 'Database System Concepts', student: 'Priya Sharma', regNo: '23CS002', issued: 'Jul 08, 2024', due: 'Jul 22, 2024', status: 'issued' },
  { id: '3', book: 'Engineering Mathematics', student: 'Rahul Verma', regNo: '23EC003', issued: 'Jun 25, 2024', due: 'Jul 09, 2024', status: 'overdue' },
  { id: '4', book: 'Operating System Concepts', student: 'Neha Kapoor', regNo: '23EC008', issued: 'Jul 05, 2024', due: 'Jul 19, 2024', status: 'returned' },
]

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (!isAuthenticated || !user) { router.push('/login'); return null }

  const filteredBooks = BOOKS.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.isbn.includes(search)
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">{user.collegeName}</p>
            <h1 className="text-xl font-bold text-slate-900">Library</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button variant="primary" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Book</Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Books', value: BOOKS.reduce((s, b) => s + b.total, 0), icon: BookOpen },
            { label: 'Available', value: BOOKS.reduce((s, b) => s + b.available, 0), icon: Bookmark },
            { label: 'Issued', value: RECENT_ISSUES.filter(i => i.status === 'issued').length, icon: User },
            { label: 'Overdue', value: RECENT_ISSUES.filter(i => i.status === 'overdue').length, icon: AlertTriangle },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-700"><stat.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Books Catalog</CardTitle>
                <CardDescription>Browse available books in the library</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Search by title, author, ISBN, or category..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="space-y-3">
                  {filteredBooks.map(book => (
                    <div key={book.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors">
                      <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900">{book.title}</h4>
                        <p className="text-sm text-slate-500">{book.author}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span>ISBN: {book.isbn}</span>
                          <span>{book.category}</span>
                          <span>Shelf: {book.location}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${book.available > 0 ? 'text-green-600' : 'text-red-600'}`}>{book.available}</p>
                        <p className="text-xs text-slate-400">of {book.total} available</p>
                        {book.available > 0 && <Badge variant="success" size="sm" className="mt-1">In Stock</Badge>}
                        {book.available === 0 && <Badge variant="danger" size="sm" className="mt-1">Out</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Issues</CardTitle>
                <CardDescription>Currently issued and overdue books</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {RECENT_ISSUES.map(issue => (
                  <div key={issue.id} className="p-3 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-slate-900">{issue.book}</p>
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{issue.student} ({issue.regNo})</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {issue.issued}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {issue.due}</div>
                    </div>
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