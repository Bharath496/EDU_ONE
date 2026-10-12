'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TenantRecord = {
  id: string
  name: string
  code: string
  city: string
  state: string
  students: number
  plan: 'Starter' | 'Growth' | 'Campus'
  status: 'active' | 'trial' | 'paused'
  joined: string
  monthlyDemoValue: number
}

export type PlatformUserRecord = {
  id: string
  name: string
  email: string
  role: 'College Admin' | 'Faculty' | 'Student' | 'Parent'
  tenantId: string
  status: 'active' | 'inactive'
  joined: string
}

type PlatformState = {
  tenants: TenantRecord[]
  users: PlatformUserRecord[]
  addTenant: (tenant: Omit<TenantRecord, 'id' | 'joined'>) => void
  toggleTenantStatus: (id: string) => void
  addUser: (user: Omit<PlatformUserRecord, 'id' | 'joined'>) => void
  toggleUserStatus: (id: string) => void
  resetPlatformDemo: () => void
}

const TENANTS: TenantRecord[] = [
  { id: 'tenant-1', name: 'EDU_ONE Demo Institution', code: 'EDUDEMO', city: 'Coimbatore', state: 'Tamil Nadu', students: 1240, plan: 'Campus', status: 'active', joined: '2026-04-08', monthlyDemoValue: 18000 },
  { id: 'tenant-2', name: 'Northstar Institute of Technology', code: 'NIT-DEMO', city: 'Bengaluru', state: 'Karnataka', students: 860, plan: 'Growth', status: 'active', joined: '2026-06-12', monthlyDemoValue: 12000 },
  { id: 'tenant-3', name: 'Riverbend Arts & Science College', code: 'RASC-DEMO', city: 'Chennai', state: 'Tamil Nadu', students: 640, plan: 'Growth', status: 'trial', joined: '2026-09-02', monthlyDemoValue: 12000 },
  { id: 'tenant-4', name: 'Horizon Engineering College', code: 'HEC-DEMO', city: 'Kochi', state: 'Kerala', students: 420, plan: 'Starter', status: 'paused', joined: '2026-08-18', monthlyDemoValue: 6000 },
]

const USERS: PlatformUserRecord[] = [
  { id: 'platform-user-1', name: 'Rajesh Kumar', email: 'rajesh@eduone.demo', role: 'College Admin', tenantId: 'tenant-1', status: 'active', joined: '2026-04-08' },
  { id: 'platform-user-2', name: 'Priya Sharma', email: 'priya@eduone.demo', role: 'Faculty', tenantId: 'tenant-1', status: 'active', joined: '2026-04-10' },
  { id: 'platform-user-3', name: 'Meera Patel', email: 'meera@northstar.demo', role: 'College Admin', tenantId: 'tenant-2', status: 'active', joined: '2026-06-12' },
  { id: 'platform-user-4', name: 'Kavin Raj', email: 'kavin@northstar.demo', role: 'Student', tenantId: 'tenant-2', status: 'active', joined: '2026-06-20' },
  { id: 'platform-user-5', name: 'Ananya Gupta', email: 'ananya@riverbend.demo', role: 'College Admin', tenantId: 'tenant-3', status: 'active', joined: '2026-09-02' },
  { id: 'platform-user-6', name: 'Suresh Kumar', email: 'suresh@riverbend.demo', role: 'Parent', tenantId: 'tenant-3', status: 'inactive', joined: '2026-09-05' },
]

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      tenants: clone(TENANTS),
      users: clone(USERS),

      addTenant: (tenant) =>
        set((state) => ({
          tenants: [
            {
              ...tenant,
              id: `tenant-${Date.now()}`,
              joined: new Date().toISOString().slice(0, 10),
            },
            ...state.tenants,
          ],
        })),

      toggleTenantStatus: (id) =>
        set((state) => ({
          tenants: state.tenants.map((tenant) =>
            tenant.id === id
              ? { ...tenant, status: tenant.status === 'active' ? 'paused' : 'active' }
              : tenant
          ),
        })),

      addUser: (user) =>
        set((state) => ({
          users: [
            {
              ...user,
              id: `platform-user-${Date.now()}`,
              joined: new Date().toISOString().slice(0, 10),
            },
            ...state.users,
          ],
        })),

      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
              : user
          ),
        })),

      resetPlatformDemo: () => set({ tenants: clone(TENANTS), users: clone(USERS) }),
    }),
    { name: 'eduone-platform-demo-v1' }
  )
)
