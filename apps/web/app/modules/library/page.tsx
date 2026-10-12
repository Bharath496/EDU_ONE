'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  Download,
  Library,
  Plus,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAuthStore } from '@/lib/auth-store'
import { useEduStore } from '@/lib/edu-store'

export default function LibraryPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const books = useEduStore((state) => state.books)
  const addBook = useEduStore((state) => state.addBook)
  const issueBook = useEduStore((state) => state.issueBook)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const canManage = user?.role === 'College Admin' || user?.role === 'Faculty'
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    total: 1,
    available: 1,
    location: '',
  })

  const filtered = books.filter((book) => {
    const needle = search.trim().toLowerCase()
    return (
      !needle ||
      book.title.toLowerCase().includes(needle) ||
      book.author.toLowerCase().includes(needle) ||
      book.category.toLowerCase().includes(needle) ||
      book.isbn.includes(needle)
    )
  })

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canManage || !form.title.trim() || !form.author.trim()) return
    addBook({
      ...form,
      title: form.title.trim(),
      author: form.author.trim(),
      available: Math.min(form.available, form.total),
    })
    setOpen(false)
    setForm({ ...form, title: '', author: '', isbn: '', location: '' })
  }

  const exportCsv = () => {
    const csv = [
      ['Title', 'Author', 'ISBN', 'Category', 'Total', 'Available', 'Location'],
      ...filtered.map((book) => [book.title, book.author, book.isbn, book.category, book.total, book.available, book.location]),
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'eduone-library.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const totalCopies = books.reduce((sum, book) => sum + book.total, 0)
  const availableCopies = books.reduce((sum, book) => sum + book.available, 0)
  const issuedCopies = totalCopies - availableCopies
  const lowStock = books.filter((book) => book.available <= 2).length

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{user.collegeName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Library</h1>
          <p className="mt-1 text-sm text-slate-500">
            {canManage
              ? 'Persistent catalog inventory with issue simulation and CSV export.'
              : 'Browse the current library catalog and availability in read-only mode.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" />Export</Button>
          {canManage && (
            <Button size="sm" onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add book</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total copies', value: totalCopies, icon: BookOpen, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Available', value: availableCopies, icon: Bookmark, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Issued', value: issuedCopies, icon: Library, cls: 'bg-violet-50 text-violet-700' },
          { label: 'Low stock titles', value: lowStock, icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${item.cls}`}><item.icon className="h-6 w-6" /></div>
              <div><p className="text-sm text-slate-500">{item.label}</p><p className="text-2xl font-bold text-slate-950">{item.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book catalog</CardTitle>
          <CardDescription>Issue actions reduce available inventory in the persistent demo store.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 max-w-lg">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, ISBN or category" leftIcon={<Search className="h-4 w-4 text-slate-400" />} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((book) => {
              const availability = book.total ? Math.round((book.available / book.total) * 100) : 0
              return (
                <div key={book.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-950">{book.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">{book.author}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" size="sm">{book.category}</Badge>
                        <Badge variant={book.available > 2 ? 'success' : book.available > 0 ? 'warning' : 'danger'} size="sm">{book.available}/{book.total} available</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${availability}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{book.location}</span>
                    <span>ISBN {book.isbn}</span>
                  </div>
                  {canManage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      disabled={book.available <= 0}
                      onClick={() => issueBook(book.id)}
                    >
                      {book.available > 0 ? 'Issue one copy' : 'Out of stock'}
                    </Button>
                  ) : (
                    <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-500">
                      {book.available > 0 ? 'Available in library' : 'Currently unavailable'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={canManage && open}
        onClose={() => setOpen(false)}
        title="Add library book"
        description="Add a catalog item to the local workspace."
        footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="book-form">Add book</Button></div>}
      >
        <form id="book-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
          <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Shelf location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Total copies" type="number" min={1} value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value), available: Math.min(form.available, Number(e.target.value)) })} />
          <Input label="Available copies" type="number" min={0} value={form.available} onChange={(e) => setForm({ ...form, available: Number(e.target.value) })} />
        </form>
      </Modal>
    </div>
  )
}
