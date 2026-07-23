import { create } from 'zustand'
import type { User, Session } from './types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (session: Session) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  hasRole: (role: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
}

function getStoredAuth(): Partial<AuthState> {
  if (typeof window === 'undefined') return { isLoading: false }
  try {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')
    if (storedUser && storedToken) {
      return {
        user: JSON.parse(storedUser),
        token: storedToken,
        refreshToken: storedRefreshToken,
        isAuthenticated: true,
        isLoading: false,
      }
    }
  } catch {}
  return { isLoading: false }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  ...getStoredAuth(),

  setAuth: (session: Session) => {
    set({
      user: session.user,
      token: session.token,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', session.token)
      localStorage.setItem('refresh_token', session.refreshToken)
      localStorage.setItem('user', JSON.stringify(session.user))
    }
  },

  setUser: (user: User) => {
    set({ user })
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  clearAuth: () => {
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
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
    if (user.role === 'Super Admin') return true
    if (user.role === 'College Admin') return true
    if (user.role === 'Faculty') return ['attendance.read', 'attendance.write', 'marks.read', 'marks.write', 'assignments.read', 'assignments.write'].includes(permission)
    if (user.role === 'Student') return permission.endsWith('.read')
    if (user.role === 'Parent') return permission.endsWith('.read')
    return false
  },
}))