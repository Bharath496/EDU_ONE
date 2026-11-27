import { create } from 'zustand'
import type { User, Session } from './types'
import { api } from './api'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  hydrate: () => Promise<void>
  setAuth: (session: Session) => void
  setInstitutionalAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: async () => {
    if (typeof window === 'undefined') return
    set({ isLoading: true })
    try {
      const demoUser = localStorage.getItem('eduone-demo-user')
      if (demoUser) {
        const user = JSON.parse(demoUser) as User
        set({
          user,
          token: 'demo-session',
          refreshToken: null,
          isAuthenticated: true,
          isLoading: false,
        })
        return
      }

      const token = await api.refreshSession()
      const user = await api.getCurrentUser() as User
      set({
        user,
        token,
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('eduone-demo-user')
      api.setAccessToken(null)
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  setAuth: (session: Session) => {
    // This setter is reserved for the clearly labelled local demo accounts.
    api.setAccessToken(null)
    set({
      user: session.user,
      token: 'demo-session',
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('eduone-demo-user', JSON.stringify(session.user))
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },

  setInstitutionalAuth: (user: User, token: string) => {
    localStorage.removeItem('eduone-demo-user')
    api.setAccessToken(token)
    set({
      user,
      token,
      refreshToken: null,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  setUser: (user: User) => {
    set({ user })
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('eduone-demo-user')) localStorage.setItem('eduone-demo-user', JSON.stringify(user))
    }
  },

  clearAuth: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
    api.setAccessToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('eduone-demo-user')
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  hasRole: (role: string | string[]) => {
    const user = get().user
    if (!user) return false
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(user.role)
  },

  hasPermission: (permission: string) => {
    const user = get().user
    if (!user) return false
    if (user.role === 'Super Admin' || user.role === 'College Admin') return true
    if (user.role === 'Faculty') {
      return [
        'attendance.read',
        'attendance.write',
        'marks.read',
        'marks.write',
        'assignments.read',
        'assignments.write',
      ].includes(permission)
    }
    if (user.role === 'Student' || user.role === 'Parent') return permission.endsWith('.read')
    return false
  },
}))
