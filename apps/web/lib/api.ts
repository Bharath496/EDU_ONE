import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
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

        if (error.response?.status === 401 && !originalRequest._retry) {
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

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    this.refreshTokenPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then((response) => {
        const { access_token, refresh_token: newRefreshToken } = response.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', newRefreshToken)
        return access_token
      })
      .finally(() => {
        this.refreshTokenPromise = null
      })

    return this.refreshTokenPromise
  }

  private clearAuth() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  async login(email: string, password: string, collegeId?: string) {
    const response = await this.client.post('/auth/login', { email, password, college_id: collegeId })
    const { access_token, refresh_token, user } = response.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    localStorage.setItem('user', JSON.stringify(user))
    return { user, access_token, refresh_token }
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } finally {
      this.clearAuth()
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me')
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
    const response = await this.client.post('/attendance', data)
    return response.data
  }

  async bulkMarkAttendance(data: { courseId: string; date: string; records: Array<{ studentId: string; status: string }> }) {
    const response = await this.client.post('/attendance/bulk', data)
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
    const response = await this.client.post('/fees/pay', data)
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

  getClient(): AxiosInstance {
    return this.client
  }
}

export const api = new ApiClient()