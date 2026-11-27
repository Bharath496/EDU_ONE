import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null
  private accessToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      withCredentials: true,
    })

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          if (this.accessToken) {
            config.headers.Authorization = `Bearer ${this.accessToken}`
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && originalRequest && this.accessToken && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newToken = await this.refreshAccessToken()
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return this.client(originalRequest)
          } catch (refreshError) {
            this.clearAuth()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) return this.refreshTokenPromise

    this.refreshTokenPromise = axios
      .post(`${API_BASE_URL}/v1/auth/refresh`, {}, { withCredentials: true, timeout: 10000 })
      .then((response) => {
        const token = response.data.access_token as string
        this.accessToken = token
        return token
      })
      .finally(() => {
        this.refreshTokenPromise = null
      })

    return this.refreshTokenPromise
  }

  async refreshSession(): Promise<string> {
    if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV !== 'development') {
      throw new Error('Institutional API is not configured')
    }
    return this.refreshAccessToken()
  }

  private clearAuth() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }

  async login(institutionCode: string, email: string, password: string) {
    const response = await axios.post(
      `${API_BASE_URL}/v1/auth/login`,
      { institution_code: institutionCode, email, password },
      { withCredentials: true, timeout: 15000 }
    )
    const { access_token, user } = response.data
    this.accessToken = access_token
    return { user, access_token }
  }

  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/v1/auth/logout`, {}, { withCredentials: true, timeout: 10000 })
    } finally {
      this.clearAuth()
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/v1/auth/me')
    return response.data
  }

  async getColleges() {
    const response = await this.client.get('/colleges')
    return response.data
  }

  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats')
    return response.data
  }

  async getModules() {
    const response = await this.client.get('/modules')
    return response.data
  }

  async getCourses(params?: { department?: string; semester?: number; status?: string }) {
    const response = await this.client.get('/academics/courses', { params })
    return response.data
  }

  async createCourse(data: {
    code: string
    name: string
    credits: number
    department: string
    semester: number
    faculty_id?: string
    day: string
    start_time: string
    end_time: string
    room: string
    status: 'active' | 'inactive'
  }) {
    const response = await this.client.post('/academics/courses', data)
    return response.data
  }

  async getMessages(recipient?: string) {
    const response = await this.client.get('/communication/messages', {
      params: recipient ? { recipient } : undefined,
    })
    return response.data
  }

  async sendMessage(data: {
    sender: string
    sender_role: string
    recipient: string
    subject: string
    body: string
  }) {
    const response = await this.client.post('/communication/messages', data)
    return response.data
  }

  async markMessageRead(id: string) {
    const response = await this.client.post(`/communication/messages/${id}/read`)
    return response.data
  }

  async getSupportTickets(createdBy?: string) {
    const response = await this.client.get('/support/tickets', {
      params: createdBy ? { createdBy } : undefined,
    })
    return response.data
  }

  async createSupportTicket(data: {
    title: string
    category: string
    created_by: string
    priority: 'low' | 'medium' | 'high'
  }) {
    const response = await this.client.post('/support/tickets', data)
    return response.data
  }

  async updateSupportTicket(id: string, status: 'open' | 'in-progress' | 'resolved') {
    const response = await this.client.put(`/support/tickets/${id}`, { status })
    return response.data
  }

  async getStudents(params?: { page?: number; limit?: number; search?: string }) {
    const response = await this.client.get('/students', { params })
    return response.data
  }

  async getStudent(id: string) {
    const response = await this.client.get(`/students/${id}`)
    return response.data
  }

  async createStudent(data: any) {
    const response = await this.client.post('/students', data)
    return response.data
  }

  async updateStudent(id: string, data: any) {
    const response = await this.client.put(`/students/${id}`, data)
    return response.data
  }

  async deleteStudent(id: string) {
    const response = await this.client.delete(`/students/${id}`)
    return response.data
  }

  async getFaculty(params?: { page?: number; limit?: number; search?: string }) {
    const response = await this.client.get('/faculty', { params })
    return response.data
  }

  async getAttendance(params?: { studentId?: string; courseId?: string; date?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/attendance', { params })
    return response.data
  }

  async markAttendance(data: { studentId: string; courseId: string; date: string; status: string }) {
    const response = await this.client.post('/attendance', { student_id: data.studentId, course_id: data.courseId, date: data.date, status: data.status })
    return response.data
  }

  async bulkMarkAttendance(data: { courseId: string; date: string; records: Array<{ studentId: string; status: string }> }) {
    const response = await this.client.post('/attendance/bulk', { course_id: data.courseId, date: data.date, records: data.records.map((item) => ({ student_id: item.studentId, status: item.status })) })
    return response.data
  }

  async getExams(params?: { courseId?: string; upcoming?: boolean; page?: number; limit?: number }) {
    const response = await this.client.get('/exams', { params })
    return response.data
  }

  async getAssignments(params?: { courseId?: string; studentId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/assignments', { params })
    return response.data
  }

  async submitAssignment(assignmentId: string, data: { content: string; attachments?: string[] }) {
    const response = await this.client.post(`/assignments/${assignmentId}/submit`, data)
    return response.data
  }

  async getFees(params?: { studentId?: string; status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/fees', { params })
    return response.data
  }

  async makePayment(data: { feeId: string; amount: number; method: string; transactionId?: string }) {
    const response = await this.client.post('/fees/pay', { fee_id: data.feeId, amount: data.amount, method: data.method, transaction_id: data.transactionId })
    return response.data
  }

  async getNotices(params?: { role?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/notices', { params })
    return response.data
  }

  async createNotice(data: any) {
    const response = await this.client.post('/notices', data)
    return response.data
  }

  async getLibraryBooks(params?: { search?: string; category?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/library/books', { params })
    return response.data
  }

  async issueBook(bookId: string, studentId: string) {
    const response = await this.client.post('/library/issue', { book_id: bookId, student_id: studentId })
    return response.data
  }

  async returnBook(issueId: string) {
    const response = await this.client.post('/library/return', { issue_id: issueId })
    return response.data
  }

  async getReports(params?: { type: string; department?: string; semester?: number; format?: 'json' | 'csv' | 'pdf' }) {
    const response = await this.client.get('/reports', { params, responseType: params?.format === 'pdf' ? 'blob' : 'json' })
    return response.data
  }

  // Admin endpoints
  async getAdminColleges() {
    const response = await this.client.get('/admin/colleges')
    return response.data
  }

  async createCollege(data: any) {
    const response = await this.client.post('/admin/colleges', data)
    return response.data
  }

  async updateCollege(id: string, data: any) {
    const response = await this.client.put(`/admin/colleges/${id}`, data)
    return response.data
  }

  async deleteCollege(id: string) {
    const response = await this.client.delete(`/admin/colleges/${id}`)
    return response.data
  }

  async getAdminUsers(params?: { role?: string; collegeId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/admin/users', { params })
    return response.data
  }

  async getAdminAnalytics(params?: { period?: string }) {
    const response = await this.client.get('/admin/analytics', { params })
    return response.data
  }

  async getSettings() {
    const response = await this.client.get('/settings')
    return response.data
  }

  async updateSettings(data: any) {
    const response = await this.client.put('/settings', data)
    return response.data
  }

  // Versioned database-backed institutional endpoints.
  async getInstitutionalStudents(params?: { search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/v1/students', { params })
    return response.data
  }
  async getMyStudentProfile() {
    const response = await this.client.get('/v1/students/me')
    return response.data
  }
  async getInstitutionalCourses(params?: { department_id?: string; semester?: number; search?: string }) {
    const response = await this.client.get('/v1/academics/courses', { params })
    return response.data
  }
  async getMyAttendance() {
    const response = await this.client.get('/v1/attendance/me')
    return response.data
  }
  async getStudentAttendance(studentId: string) {
    const response = await this.client.get(`/v1/attendance/students/${studentId}`)
    return response.data
  }
  async getInstitutionalExams(params?: { course_id?: string }) {
    const response = await this.client.get('/v1/exams', { params })
    return response.data
  }
  async getMyResults() {
    const response = await this.client.get('/v1/results/me')
    return response.data
  }
  async getStudentResults(studentId: string) {
    const response = await this.client.get(`/v1/results/students/${studentId}`)
    return response.data
  }
  async getInstitutionalAssignments(params?: { course_id?: string }) {
    const response = await this.client.get('/v1/assignments', { params })
    return response.data
  }
  async getInstitutionalFees(params?: { status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/v1/fees/invoices', { params })
    return response.data
  }

  // Versioned database-backed institutional endpoints.
  async getInstitutionalStudents(params?: { search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/v1/students', { params })
    return response.data
  }
  async getMyStudentProfile() {
    const response = await this.client.get('/v1/students/me')
    return response.data
  }
  async getInstitutionalCourses(params?: { department_id?: string; semester?: number; search?: string }) {
    const response = await this.client.get('/v1/academics/courses', { params })
    return response.data
  }
  async getMyAttendance() {
    const response = await this.client.get('/v1/attendance/me')
    return response.data
  }
  async getStudentAttendance(studentId: string) {
    const response = await this.client.get(`/v1/attendance/students/${studentId}`)
    return response.data
  }
  async getInstitutionalExams(params?: { course_id?: string }) {
    const response = await this.client.get('/v1/exams', { params })
    return response.data
  }
  async getMyResults() {
    const response = await this.client.get('/v1/results/me')
    return response.data
  }
  async getStudentResults(studentId: string) {
    const response = await this.client.get(`/v1/results/students/${studentId}`)
    return response.data
  }
  async getInstitutionalAssignments(params?: { course_id?: string }) {
    const response = await this.client.get('/v1/assignments', { params })
    return response.data
  }
  async getInstitutionalFees(params?: { status?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/v1/fees/invoices', { params })
    return response.data
  }

  async createInstitutionalCourse(payload: { code: string; title: string; credits: number; department_id?: string; semester: number; class_id?: string }) {
    const response = await this.client.post('/v1/academics/courses', payload)
    return response.data
  }
  async enrollStudents(courseId: string, studentProfileIds: string[]) {
    const response = await this.client.post(`/v1/academics/courses/${courseId}/enrollments`, { student_profile_ids: studentProfileIds })
    return response.data
  }
  async createAttendanceSession(payload: { course_id: string; session_date: string; period: number; topic?: string }) {
    const response = await this.client.post('/v1/attendance/sessions', payload)
    return response.data
  }
  async markAttendance(sessionId: string, records: Array<{ student_profile_id: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>) {
    const response = await this.client.post(`/v1/attendance/sessions/${sessionId}/records`, { records })
    return response.data
  }
  async lockAttendanceSession(sessionId: string) {
    const response = await this.client.post(`/v1/attendance/sessions/${sessionId}/lock`)
    return response.data
  }
  async createInstitutionalExam(payload: { course_id: string; code: string; title: string; exam_type: 'internal' | 'midterm' | 'final' | 'quiz' | 'practical'; start_at: string; end_at: string; max_marks: number }) {
    const response = await this.client.post('/v1/exams', payload)
    return response.data
  }
  async publishInstitutionalExam(examId: string) {
    const response = await this.client.post(`/v1/exams/${examId}/publish`)
    return response.data
  }
  async enterExamResults(examId: string, results: Array<{ student_profile_id: string; marks_obtained: number; grade?: string; remarks?: string }>) {
    const response = await this.client.post(`/v1/exams/${examId}/results`, { results })
    return response.data
  }
  async publishExamResults(examId: string) {
    const response = await this.client.post(`/v1/exams/${examId}/publish-results`)
    return response.data
  }
  async createInstitutionalAssignment(payload: { course_id: string; title: string; description: string; due_at: string; max_marks: number }) {
    const response = await this.client.post('/v1/assignments', payload)
    return response.data
  }
  async submitInstitutionalAssignment(assignmentId: string, content: string) {
    const response = await this.client.post(`/v1/assignments/${assignmentId}/submissions`, { content })
    return response.data
  }
  async gradeInstitutionalSubmission(submissionId: string, marks_obtained: number, feedback?: string) {
    const response = await this.client.post(`/v1/assignments/submissions/${submissionId}/grade`, { marks_obtained, feedback })
    return response.data
  }
  async createFeeInvoice(payload: { student_profile_id: string; invoice_number: string; fee_type: string; description?: string; amount: number; due_date: string }) {
    const response = await this.client.post('/v1/fees/invoices', payload)
    return response.data
  }
  async requestFeePayment(invoiceId: string, payload: { amount: number; method: 'upi' | 'bank_transfer' | 'cash' | 'cheque' | 'dd'; payment_reference?: string }) {
    const response = await this.client.post(`/v1/fees/invoices/${invoiceId}/payments`, payload)
    return response.data
  }
  async verifyFeePayment(paymentId: string) {
    const response = await this.client.post(`/v1/fees/payments/${paymentId}/verify`)
    return response.data
  }

  getClient(): AxiosInstance {
    return this.client
  }
}

export const api = new ApiClient()