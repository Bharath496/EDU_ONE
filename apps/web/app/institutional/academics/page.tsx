'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

export default function InstitutionalAcademicsPage() {
  const router = useRouter()
  const { user, token, isAuthenticated, isLoading } = useAuthStore()
  const role = user?.role || ''
  const studentMode = role === 'Student'
  const facultyMode = role === 'Faculty'
  const examAuthority = ['Exam Cell', 'College Admin'].includes(role)
  const [courses, setCourses] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({})
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
  const [examCode, setExamCode] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examType, setExamType] = useState('internal')
  const [examStart, setExamStart] = useState('')
  const [examEnd, setExamEnd] = useState('')
  const [examMax, setExamMax] = useState('50')
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDescription, setAssignmentDescription] = useState('')
  const [assignmentDue, setAssignmentDue] = useState('')
  const [assignmentMax, setAssignmentMax] = useState('20')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      if (studentMode) {
        const [examRows, assignmentRows, resultRows] = await Promise.all([
          api.getInstitutionalExams(), api.getInstitutionalAssignments(), api.getMyResults(),
        ])
        setExams(Array.isArray(examRows) ? examRows : [])
        setAssignments(Array.isArray(assignmentRows) ? assignmentRows : [])
        setResults(Array.isArray(resultRows) ? resultRows : [])
      } else {
        const [courseRows, examRows, assignmentRows] = await Promise.all([
          api.getInstitutionalCourses(), api.getInstitutionalExams(), api.getInstitutionalAssignments(),
        ])
        setCourses(Array.isArray(courseRows) ? courseRows : courseRows.items || [])
        setExams(Array.isArray(examRows) ? examRows : [])
        setAssignments(Array.isArray(assignmentRows) ? assignmentRows : [])
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load academic records.')
    } finally { setLoading(false) }
  }, [studentMode])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user || token === 'demo-session') { router.replace('/'); return }
    if (!['Student', 'Faculty', 'Exam Cell', 'College Admin', 'HOD', 'Class Advisor'].includes(role)) { router.replace('/institutional'); return }
    void load()
  }, [isAuthenticated, isLoading, load, role, router, token, user])

  const createExam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.createInstitutionalExam({
        course_id: selectedCourse, code: examCode, title: examTitle,
        exam_type: examType as 'internal' | 'midterm' | 'final' | 'quiz' | 'practical',
        start_at: new Date(examStart).toISOString(), end_at: new Date(examEnd).toISOString(),
        max_marks: Number(examMax),
      })
      setExamCode(''); setExamTitle(''); setExamStart(''); setExamEnd('')
      setSuccess('Exam created in draft. Publish it before marks entry.')
      await load()
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not create exam.') }
    finally { setSaving(false) }
  }

  const publishExam = async (id: string) => {
    setError(''); setSuccess('')
    try { await api.publishInstitutionalExam(id); setSuccess('Exam published.'); await load() }
    catch (err: any) { setError(err?.response?.data?.detail || 'Could not publish exam.') }
  }

  const publishResults = async (id: string) => {
    setError(''); setSuccess('')
    try { await api.publishExamResults(id); setSuccess('Exam results published to students.'); await load() }
    catch (err: any) { setError(err?.response?.data?.detail || 'Could not publish results.') }
  }

  const loadExamStudents = async (examId: string) => {
    setSelectedExam(examId); setStudents([]); setMarks({})
    try {
      const exam = exams.find(row => row.id === examId)
      if (!exam) return
      const roster = await api.getCourseStudents(exam.course_id)
      setStudents(roster || [])
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not load exam roster.') }
  }

  const enterMarks = async () => {
    if (!selectedExam || !students.length) return
    if (students.some(student => marks[student.id] === undefined || marks[student.id] === '')) {
      setError('Enter marks for every student in the course roster.')
      return
    }
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.enterExamResults(selectedExam, students.map(student => ({
        student_profile_id: student.id, marks_obtained: Number(marks[student.id]),
      })))
      setSuccess('Marks entered. Results remain hidden until the Exam Cell publishes them.')
      setSelectedExam(''); setStudents([]); setMarks({})
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not save marks.') }
    finally { setSaving(false) }
  }

  const createAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      await api.createInstitutionalAssignment({
        course_id: selectedCourse, title: assignmentTitle, description: assignmentDescription,
        due_at: new Date(assignmentDue).toISOString(), max_marks: Number(assignmentMax),
      })
      setAssignmentTitle(''); setAssignmentDescription(''); setAssignmentDue('')
      setSuccess('Assignment published.')
      await load()
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not create assignment.') }
    finally { setSaving(false) }
  }

  const submitAssignment = async (id: string) => {
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.submitInstitutionalAssignment(id, submissionText[id] || '')
      setSuccess('Assignment submitted.')
      setSubmissionText(previous => ({ ...previous, [id]: '' }))
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not submit assignment.') }
    finally { setSaving(false) }
  }

  const loadSubmissions = async (id: string) => {
    setSelectedAssignment(id); setSubmissions([])
    try { setSubmissions(await api.getAssignmentSubmissions(id) || []) }
    catch (err: any) { setError(err?.response?.data?.detail || 'Could not load submissions.') }
  }

  const gradeSubmission = async (id: string) => {
    const value = gradeInputs[id]
    if (value === undefined || value === '') return
    setSaving(true); setError('')
    try {
      await api.gradeInstitutionalSubmission(id, Number(value))
      if (selectedAssignment) await loadSubmissions(selectedAssignment)
      setSuccess('Submission graded.')
    } catch (err: any) { setError(err?.response?.data?.detail || 'Could not grade submission.') }
    finally { setSaving(false) }
  }

  if (isLoading || loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading academics...</main>

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-4"><Link href="/institutional" className="inline-flex items-center gap-2 text-sm text-indigo-600"><ArrowLeft className="h-4 w-4" /> Workspace</Link><h1 className="mt-2 text-xl font-bold text-slate-950">Academics, exams and assignments</h1><p className="text-sm text-slate-500">Course-scoped academic records and controlled result publication.</p></div></header>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}

        {!studentMode && <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm">Course<select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Choose course</option>{courses.map(course => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}</select></label>
          <div className="text-sm text-slate-500 sm:self-end">{courses.length} courses visible under your role scope</div>
        </CardContent></Card>}

        {examAuthority && <Card><CardContent className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4" /> Create examination</h2><form onSubmit={createExam} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Exam code" value={examCode} onChange={e => setExamCode(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" />
          <input required placeholder="Exam title" value={examTitle} onChange={e => setExamTitle(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" />
          <select value={examType} onChange={e => setExamType(e.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="internal">Internal</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option><option value="practical">Practical</option></select>
          <input required type="number" min="1" step="0.5" value={examMax} onChange={e => setExamMax(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" placeholder="Maximum marks" />
          <label className="text-sm">Start<input required type="datetime-local" value={examStart} onChange={e => setExamStart(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <label className="text-sm">End<input required type="datetime-local" value={examEnd} onChange={e => setExamEnd(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <div className="sm:col-span-2"><Button type="submit" disabled={saving || !selectedCourse}>Create exam</Button></div>
        </form></CardContent></Card>}

        {facultyMode && <Card><CardContent className="p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4" /> Create assignment</h2><form onSubmit={createAssignment} className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Assignment title" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" />
          <input required type="number" min="1" step="0.5" value={assignmentMax} onChange={e => setAssignmentMax(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm" placeholder="Maximum marks" />
          <textarea required rows={3} placeholder="Description and instructions" value={assignmentDescription} onChange={e => setAssignmentDescription(e.target.value)} className="rounded-lg border border-slate-300 p-3 text-sm sm:col-span-2" />
          <label className="text-sm">Due date<input required type="datetime-local" value={assignmentDue} onChange={e => setAssignmentDue(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
          <div className="self-end"><Button type="submit" disabled={saving || !selectedCourse}>Publish assignment</Button></div>
        </form></CardContent></Card>}

        {exams.length > 0 && <Card><CardContent className="p-5"><h2 className="font-semibold">Examinations</h2><div className="mt-4 space-y-3">{exams.map(item => <div key={item.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center"><div><p className="font-medium">{item.title} · {item.code}</p><p className="text-xs text-slate-500">{item.status} · {new Date(item.start_at).toLocaleString()} · Max {item.max_marks}</p></div><div className="flex flex-wrap gap-2">{(facultyMode || role === 'Exam Cell') && item.status !== 'draft' && <Button size="sm" variant="outline" onClick={() => void loadExamStudents(item.id)}>Enter marks</Button>}{examAuthority && item.status === 'draft' && <Button size="sm" onClick={() => void publishExam(item.id)}>Publish exam</Button>}{examAuthority && item.status === 'published' && <Button size="sm" variant="outline" onClick={() => void publishResults(item.id)}>Publish results</Button>}</div></div>)}</div></CardContent></Card>}

        {selectedExam && <Card><CardContent className="p-5"><h2 className="font-semibold">Enter marks</h2><div className="mt-4 space-y-3">{students.map(student => <div key={student.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2"><div><p className="text-sm font-medium">{student.name}</p><p className="text-xs text-slate-500">{student.registration_number}</p></div><input type="number" min="0" step="0.5" value={marks[student.id] || ''} onChange={e => setMarks(previous => ({ ...previous, [student.id]: e.target.value }))} placeholder="Marks" className="h-10 w-28 rounded-lg border border-slate-300 px-3 text-sm" /></div>)}</div><div className="mt-4 flex justify-end"><Button onClick={() => void enterMarks()} disabled={saving || !students.length}>Save marks (unpublished)</Button></div></CardContent></Card>}

        {assignments.length > 0 && <Card><CardContent className="p-5"><h2 className="font-semibold">Assignments</h2><div className="mt-4 space-y-4">{assignments.map(item => <div key={item.id} className="border-b border-slate-100 pb-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-slate-500">Due {new Date(item.due_at).toLocaleString()} · Max {item.max_marks}</p></div>{facultyMode && <Button size="sm" variant="outline" onClick={() => void loadSubmissions(item.id)}>View submissions</Button>}</div>{studentMode && <div className="mt-3 flex flex-col gap-2 sm:flex-row"><textarea rows={2} value={submissionText[item.id] || ''} onChange={e => setSubmissionText(previous => ({ ...previous, [item.id]: e.target.value }))} placeholder="Paste your assignment response here..." className="flex-1 rounded-lg border border-slate-300 p-3 text-sm" /><Button size="sm" onClick={() => void submitAssignment(item.id)} disabled={saving || !(submissionText[item.id] || '').trim()}>Submit</Button></div>}</div>)}</div></CardContent></Card>}

        {selectedAssignment && facultyMode && <Card><CardContent className="p-5"><h2 className="font-semibold">Student submissions ({submissions.length})</h2><div className="mt-4 space-y-4">{submissions.map(item => <div key={item.id} className="border-b border-slate-100 pb-3"><p className="font-medium">{item.student_name} · {item.registration_number}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.content}</p><p className="mt-1 text-xs text-slate-500">{item.status} · {item.marks_obtained ?? 'Not graded'}</p><div className="mt-2 flex gap-2"><input type="number" min="0" value={gradeInputs[item.id] || ''} onChange={e => setGradeInputs(previous => ({ ...previous, [item.id]: e.target.value }))} placeholder="Marks" className="h-9 w-28 rounded-lg border border-slate-300 px-3 text-sm" /><Button size="sm" onClick={() => void gradeSubmission(item.id)} disabled={saving}>Grade</Button></div></div>)}</div></CardContent></Card>}

        {results.length > 0 && <Card><CardContent className="p-5"><h2 className="font-semibold">Published results</h2><div className="mt-4 space-y-2">{results.map(item => <div key={item.id} className="flex justify-between text-sm"><span>{item.exam_title}</span><span>{item.marks_obtained}/{item.max_marks} · {item.grade || '—'}</span></div>)}</div></CardContent></Card>}
      </div>
    </main>
  )
}
