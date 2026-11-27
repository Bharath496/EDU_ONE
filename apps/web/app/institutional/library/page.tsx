'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

export default function InstitutionalLibraryPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const manager = ['Librarian', 'College Admin'].includes(user?.role || '')
  const [books, setBooks] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('')
  const [copies, setCopies] = useState('1')
  const [bookId, setBookId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const bookResponse = await api.getInstitutionalLibraryBooks({ limit: 100 })
      setBooks(bookResponse.items || [])
      if (manager) {
        const [loanRows, studentResponse] = await Promise.all([
          api.getInstitutionalLibraryLoans({ active_only: true }),
          api.getInstitutionalStudents({ limit: 200 }),
        ])
        setLoans(loanRows || [])
        setStudents(studentResponse.items || [])
      } else {
        setLoans(await api.getMyLibraryLoans())
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load library records.')
    } finally {
      setLoading(false)
    }
  }, [manager])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Librarian', 'College Admin', 'Student'].includes(user.role)) { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, router, token, user])

  const addBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.createLibraryBook({ isbn, title, author, category: category || undefined, total_copies: Number(copies) })
      setSuccess('Book added to the catalogue.')
      setIsbn(''); setTitle(''); setAuthor(''); setCategory(''); setCopies('1')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not add the book.')
    } finally { setSaving(false) }
  }

  const issueBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.issueLibraryBook({ book_id: bookId, student_profile_id: studentId, due_date: dueDate })
      setSuccess('Book issued successfully.')
      setBookId(''); setStudentId(''); setDueDate('')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not issue this book.')
    } finally { setSaving(false) }
  }

  const returnBook = async (loanId: string) => {
    setError(''); setSuccess('')
    try {
      await api.returnLibraryBook(loanId)
      setSuccess('Book returned and fine calculated if overdue.')
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not return this book.')
    }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading library...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Library</h1><p className="text-sm text-slate-500">Institution-wide catalogue and circulation records.</p></div></header>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
        {manager && <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardContent className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4" /> Add book</h2><form onSubmit={addBook} className="space-y-3">
            <label className="block text-sm">ISBN<input required value={isbn} onChange={e => setIsbn(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Title<input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Author<input required value={author} onChange={e => setAuthor(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Category<input value={category} onChange={e => setCategory(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="block text-sm">Total copies<input required type="number" min="0" value={copies} onChange={e => setCopies(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <Button type="submit" disabled={saving} className="w-full">Add to catalogue</Button>
          </form></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="mb-4 font-semibold">Issue a book</h2><form onSubmit={issueBook} className="space-y-3">
            <label className="block text-sm">Book<select required value={bookId} onChange={e => setBookId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose book</option>{books.filter(book => book.available_copies > 0).map(book => <option key={book.id} value={book.id}>{book.title} ({book.available_copies} available)</option>)}</select></label>
            <label className="block text-sm">Student<select required value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose student</option>{students.map(student => <option key={student.id} value={student.id}>{student.registration_number} · {student.name}</option>)}</select></label>
            <label className="block text-sm">Due date<input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
            <Button type="submit" disabled={saving || !bookId || !studentId} className="w-full">Issue book</Button>
          </form></CardContent></Card>
        </div>}
        <Card><CardContent className="p-5"><h2 className="font-semibold">Book catalogue ({books.length})</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{books.map(book => <div key={book.id} className="rounded-lg border border-slate-200 p-4"><p className="font-medium">{book.title}</p><p className="text-sm text-slate-500">{book.author} · {book.category || 'General'}</p><p className="mt-2 text-xs text-slate-600">{book.available_copies} / {book.total_copies} available</p></div>)}</div>{books.length === 0 && <p className="mt-3 text-sm text-slate-500">No books in the catalogue yet.</p>}</CardContent></Card>
        <Card><CardContent className="p-5"><h2 className="font-semibold">{manager ? 'Active loans' : 'My loans'} ({loans.length})</h2><div className="mt-4 space-y-3">{loans.map(loan => <div key={loan.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"><div><p className="font-medium">{loan.book_title}</p><p className="text-xs text-slate-500">{loan.registration_number || ''} · Due {loan.due_date} · {loan.status}</p><p className="text-xs text-slate-500">Fine recorded: ₹{loan.fine_amount}</p></div>{manager && loan.status !== 'returned' && <Button size="sm" variant="outline" onClick={() => void returnBook(loan.id)}>Return book</Button>}</div>)}{loans.length === 0 && <p className="text-sm text-slate-500">No library loans recorded.</p>}</div></CardContent></Card>
      </div>
    </main>
  )
}
