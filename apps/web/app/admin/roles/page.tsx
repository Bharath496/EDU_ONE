'use client'

import { useRouter } from 'next/navigation'
import { Check, KeyRound, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { GLOBAL_NAV } from '@/lib/navigation'
import { usePlatformStore, type InstitutionRole } from '@/lib/platform-store'

const ROLES: InstitutionRole[] = ['College Admin', 'Faculty', 'Student', 'Parent', 'Staff']
const LOCKED = new Set(['/dashboard', '/modules/profile', '/modules/settings'])

export default function RolesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const rolePermissions = usePlatformStore((state) => state.rolePermissions)
  const toggleRolePermission = usePlatformStore((state) => state.toggleRolePermission)
  const resetRolePermissions = usePlatformStore((state) => state.resetRolePermissions)

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">Platform Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Roles & Permissions</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Toggle module access for institution roles. Changes immediately affect the sidebar,
            command palette, mobile navigation and route guard in this browser demo.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={resetRolePermissions}>
          <RefreshCcw className="h-4 w-4" />
          Reset defaults
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant="secondary" size="sm">
                  {rolePermissions[role].length} modules
                </Badge>
              </div>
              <h2 className="mt-4 font-semibold text-slate-950">{role}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {role === 'College Admin' && 'Institution-wide management'}
                {role === 'Faculty' && 'Teaching and academic workflows'}
                {role === 'Student' && 'Learning and self-service'}
                {role === 'Parent' && 'Monitoring and support'}
                {role === 'Staff' && 'Operations and support'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary-600" />
            Module permission matrix
          </CardTitle>
          <CardDescription>
            Dashboard, Profile and Settings are locked on for continuity. Other modules can be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Module</th>
                  {ROLES.map((role) => (
                    <th key={role} className="px-4 py-3 text-center font-medium">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GLOBAL_NAV.map((module) => (
                  <tr key={module.href} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <module.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{module.label}</p>
                          <p className="text-xs text-slate-500">{module.description}</p>
                        </div>
                      </div>
                    </td>
                    {ROLES.map((role) => {
                      const enabled = rolePermissions[role].includes(module.href)
                      const locked = LOCKED.has(module.href)
                      return (
                        <td key={role} className="px-4 py-4 text-center">
                          <button
                            disabled={locked}
                            onClick={() => toggleRolePermission(role, module.href)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              enabled
                                ? 'border-primary-200 bg-primary-50 text-primary-700'
                                : 'border-slate-200 bg-white text-slate-300 hover:bg-slate-50'
                            } ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
                            title={locked ? 'Required module' : enabled ? 'Disable module' : 'Enable module'}
                          >
                            {enabled && <Check className="h-4 w-4" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
