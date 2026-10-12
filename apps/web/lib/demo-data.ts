export type StudentRecord = {
  id: string
  name: string
  regNo: string
  department: string
  semester: number
  batch: string
  email: string
  phone: string
  attendance: number
  cgpa: number
  status: 'active' | 'inactive'
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export type AttendanceSession = {
  id: string
  course: string
  date: string
  records: Record<string, AttendanceStatus>
}

export type AssignmentRecord = {
  id: string
  title: string
  course: string
  department: string
  dueDate: string
  maxMarks: number
  submissions: number
  totalStudents: number
  status: 'draft' | 'published' | 'closed'
}

export type NoticeRecord = {
  id: string
  title: string
  content: string
  author: string
  target: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  publishedAt: string
  pinned: boolean
  views: number
}

export type FeeRecord = {
  id: string
  studentId: string
  feeType: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'paid' | 'pending' | 'upcoming' | 'overdue'
  method?: string
}

export const COURSES = [
  'Artificial Intelligence (AIML-501)',
  'Machine Learning (AIML-502)',
  'Database Systems (CSE-302)',
  'Data Structures (CSE-301)',
  'Operating Systems (CSE-303)',
]

export const DEMO_STUDENTS: StudentRecord[] = [
  { id: '1', name: 'Arjun Kumar', regNo: '24AI001', department: 'AIML', semester: 5, batch: '2024-27', email: 'arjun.k@eduone.demo', phone: '+91 98765 40001', attendance: 94, cgpa: 8.7, status: 'active' },
  { id: '2', name: 'Priya Sharma', regNo: '24AI002', department: 'AIML', semester: 5, batch: '2024-27', email: 'priya.s@eduone.demo', phone: '+91 98765 40002', attendance: 92, cgpa: 9.1, status: 'active' },
  { id: '3', name: 'Rahul Verma', regNo: '24CS003', department: 'CSE', semester: 5, batch: '2024-27', email: 'rahul.v@eduone.demo', phone: '+91 98765 40003', attendance: 78, cgpa: 7.2, status: 'active' },
  { id: '4', name: 'Sneha Patel', regNo: '23EC004', department: 'ECE', semester: 7, batch: '2023-27', email: 'sneha.p@eduone.demo', phone: '+91 98765 40004', attendance: 96, cgpa: 8.9, status: 'active' },
  { id: '5', name: 'Vikram Singh', regNo: '24CS005', department: 'CSE', semester: 5, batch: '2024-27', email: 'vikram.s@eduone.demo', phone: '+91 98765 40005', attendance: 58, cgpa: 5.8, status: 'inactive' },
  { id: '6', name: 'Ananya Gupta', regNo: '24DS006', department: 'Data Science', semester: 5, batch: '2024-27', email: 'ananya.g@eduone.demo', phone: '+91 98765 40006', attendance: 88, cgpa: 8.4, status: 'active' },
  { id: '7', name: 'Rohit Joshi', regNo: '23AI007', department: 'AIML', semester: 7, batch: '2023-27', email: 'rohit.j@eduone.demo', phone: '+91 98765 40007', attendance: 91, cgpa: 8.2, status: 'active' },
  { id: '8', name: 'Neha Kapoor', regNo: '24EC008', department: 'ECE', semester: 5, batch: '2024-27', email: 'neha.k@eduone.demo', phone: '+91 98765 40008', attendance: 85, cgpa: 7.9, status: 'active' },
  { id: '9', name: 'Kavin Raj', regNo: '25IT009', department: 'IT', semester: 3, batch: '2025-28', email: 'kavin.r@eduone.demo', phone: '+91 98765 40009', attendance: 74, cgpa: 6.9, status: 'active' },
  { id: '10', name: 'Meera N', regNo: '25DS010', department: 'Data Science', semester: 3, batch: '2025-28', email: 'meera.n@eduone.demo', phone: '+91 98765 40010', attendance: 63, cgpa: 6.1, status: 'active' },
]

export const DEMO_ATTENDANCE: AttendanceSession[] = [
  {
    id: 'att-2026-10-12-ai',
    course: 'Artificial Intelligence (AIML-501)',
    date: '2026-10-12',
    records: {
      '1': 'present', '2': 'present', '3': 'late', '4': 'present', '5': 'absent',
      '6': 'present', '7': 'present', '8': 'excused', '9': 'present', '10': 'absent',
    },
  },
  {
    id: 'att-2026-10-11-db',
    course: 'Database Systems (CSE-302)',
    date: '2026-10-11',
    records: {
      '1': 'present', '2': 'present', '3': 'present', '4': 'present', '5': 'absent',
      '6': 'present', '7': 'late', '8': 'present', '9': 'present', '10': 'present',
    },
  },
]

export const DEMO_ASSIGNMENTS: AssignmentRecord[] = [
  { id: 'asg-1', title: 'Build a Classification Pipeline', course: 'Machine Learning', department: 'AIML', dueDate: '2026-10-16', maxMarks: 50, submissions: 34, totalStudents: 42, status: 'published' },
  { id: 'asg-2', title: 'SQL Query Optimization Lab', course: 'Database Systems', department: 'CSE', dueDate: '2026-10-18', maxMarks: 30, submissions: 28, totalStudents: 40, status: 'published' },
  { id: 'asg-3', title: 'Operating Systems Case Study', course: 'Operating Systems', department: 'CSE', dueDate: '2026-10-23', maxMarks: 40, submissions: 12, totalStudents: 40, status: 'published' },
  { id: 'asg-4', title: 'Prompt Engineering Mini Project', course: 'Artificial Intelligence', department: 'AIML', dueDate: '2026-10-29', maxMarks: 50, submissions: 0, totalStudents: 42, status: 'draft' },
]

export const DEMO_NOTICES: NoticeRecord[] = [
  { id: 'notice-1', title: 'Semester Internal Assessment Schedule', content: 'Internal assessments begin on 19 October. Students should verify the timetable and hall allocation before the exam date.', author: 'Academic Office', target: 'Students & Faculty', priority: 'high', publishedAt: '2026-10-12T08:30:00', pinned: true, views: 1240 },
  { id: 'notice-2', title: 'Hackathon Registration Open', content: 'Registrations are open for the 24-hour campus innovation hackathon. Cross-department teams are encouraged.', author: 'Innovation Cell', target: 'All Students', priority: 'medium', publishedAt: '2026-10-11T10:15:00', pinned: true, views: 890 },
  { id: 'notice-3', title: 'Library Extended Hours', content: 'The central library will remain open until 9:30 PM during the assessment period.', author: 'Library', target: 'Everyone', priority: 'low', publishedAt: '2026-10-10T15:00:00', pinned: false, views: 605 },
  { id: 'notice-4', title: 'Faculty Review Meeting', content: 'Department faculty are requested to attend the monthly academic review at 3:00 PM on Friday.', author: 'Principal Office', target: 'Faculty', priority: 'urgent', publishedAt: '2026-10-10T09:00:00', pinned: false, views: 310 },
]

export const DEMO_FEES: FeeRecord[] = [
  { id: 'fee-1', studentId: '1', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-09-30', paidDate: '2026-09-24', status: 'paid', method: 'UPI' },
  { id: 'fee-2', studentId: '2', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-09-30', paidDate: '2026-09-26', status: 'paid', method: 'Net Banking' },
  { id: 'fee-3', studentId: '3', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-10-10', status: 'overdue' },
  { id: 'fee-4', studentId: '4', feeType: 'Exam Fee', amount: 5000, dueDate: '2026-10-20', status: 'pending' },
  { id: 'fee-5', studentId: '5', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-09-30', status: 'overdue' },
  { id: 'fee-6', studentId: '6', feeType: 'Library Fee', amount: 3500, dueDate: '2026-11-01', status: 'upcoming' },
  { id: 'fee-7', studentId: '7', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-09-30', paidDate: '2026-09-20', status: 'paid', method: 'DD' },
  { id: 'fee-8', studentId: '8', feeType: 'Transport Fee', amount: 6000, dueDate: '2026-10-25', status: 'pending' },
  { id: 'fee-9', studentId: '9', feeType: 'Exam Fee', amount: 5000, dueDate: '2026-11-05', status: 'upcoming' },
  { id: 'fee-10', studentId: '10', feeType: 'Tuition Fee', amount: 45000, dueDate: '2026-10-15', status: 'pending' },
]
