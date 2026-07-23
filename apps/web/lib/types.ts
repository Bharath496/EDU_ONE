export interface NavItem {
  label: string
  href: string
  icon: any
  description: string
}

export interface QuickAction {
  label: string
  href: string
  icon: any
  description: string
}

export interface Module {
  id: string
  name: string
  description: string
  icon: any
  href: string
  enabled: boolean
  permissions: string[]
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  collegeId: string
  collegeName: string
  avatar?: string
  regNo?: string
  department?: string
  semester?: number
}

export interface Session {
  user: User
  token: string
  refreshToken: string
  expiresAt: number
}

export interface College {
  id: string
  name: string
  code: string
  city: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  status: 'active' | 'pending' | 'inactive'
}

export interface Course {
  id: string
  code: string
  name: string
  credits: number
  department: string
  semester: number
  facultyId?: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  courseId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  markedBy: string
  markedAt: string
}

export interface Exam {
  id: string
  name: string
  courseId: string
  date: string
  startTime: string
  endTime: string
  maxMarks: number
  type: 'midterm' | 'final' | 'quiz' | 'assignment'
}

export interface Assignment {
  id: string
  title: string
  description: string
  courseId: string
  assignedBy: string
  assignedAt: string
  dueDate: string
  maxMarks: number
  attachments: string[]
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  submittedAt: string
  content: string
  attachments: string[]
  marks?: number
  gradedBy?: string
  gradedAt?: string
  feedback?: string
}

export interface FeeStructure {
  id: string
  name: string
  amount: number
  dueDate: string
  category: 'tuition' | 'hostel' | 'transport' | 'library' | 'exam' | 'other'
  semester: number
  department?: string
}

export interface FeePayment {
  id: string
  studentId: string
  feeStructureId: string
  amount: number
  paidAt: string
  method: 'online' | 'cash' | 'cheque' | 'dd'
  transactionId?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  receiptUrl?: string
}

export interface Notice {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  targetRoles: string[]
  targetDepartments?: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  publishedAt: string
  expiresAt?: string
  attachments: string[]
}

export interface LibraryBook {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  availableCopies: number
  location: string
  coverImage?: string
}

export interface BookIssue {
  id: string
  bookId: string
  studentId: string
  issuedAt: string
  dueDate: string
  returnedAt?: string
  status: 'issued' | 'returned' | 'overdue' | 'lost'
  fine?: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StatCard {
  label: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
}