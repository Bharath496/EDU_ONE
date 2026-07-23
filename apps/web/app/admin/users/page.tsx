'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/lib/auth-store'
import { Search, Filter, ChevronRight, MoreHorizontal, Shield, Mail, Phone, Calendar, Download } from 'lucide-react'

const USERS = [
  { id: '1', name: 'Dr. K. Prakasan', email: 'prakasan@psgct.edu', role: 'College Admin', college: 'PSG College of Technology', status: 'active', joined: 'Jan 2023', phone: '+91 9876543210' },
  { id: '2', name: 'Prof. Meera Patel', email: 'meera.patel@srmit.edu', role: 'Faculty', college: 'SRM Institute of Technology', status: 'active', joined: 'Mar 2023', phone: '+91 9876543211' },
  { id: '3', name: 'Arjun Kumar', email: 'arjun.k@vit.edu', role: 'Student', college: 'VIT University', status: 'active', joined: 'Jun 2024', phone: '+91 9876543212' },
  { id: '4', name: 'Fr. John Pereira', email: 'john.pereira@sxc.edu', role: 'College Admin', college: 'St. Xavier College', status: 'pending', joined: 'Jul 2024', phone: '+91 9876543213' },
  { id: '5', name: 'Mr. Ashok Kumar', email: 'ashok@dps.edu', role: 'Staff', college: 'Delhi Public School', status: 'active', joined: 'Jun 2023', phone: '+91 9876543214' },
  { id: '6', name: 'Dr. S. S. Rao', email: 'ssrao@bitsp.edu', role: 'College Admin', college: 'BITS Pilani', status: 'active', joined: 'Jan 2023', phone: '+91 9876543215' },
  { id: '7', name: 'Priya Sharma', email: 'priya.sharma@christ.edu', role: 'Faculty', college: 'Christ University', status: 'inactive', joined: 'Apr 2023', phone: '+91 9876543216' },
  { id: '8', name: 'Rahul Verma', email: 'rahul.v@symbiosis.edu', role: 'Student', college: 'Symbiosis International University', status: 'active', joined: 'Aug 2024', phone: '+91 9876543217' },
]

const ROLE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'secondary'> = {
  'College Admin': 'primary',
  Faculty: 'success',
  Student: 'warning',
  Staff: 'secondary',
}

export default function UsersPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.college.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Users</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="primary" size="sm" className="gap-2">
              <Shield className="w-4 h-4" />
              Invite User
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, email, role, or college..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">User</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">College</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Joined</th>
                    <th className="w-10 py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ROLE_COLORS[u.role] || 'secondary'} size="sm">{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.college}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.status === 'active' ? 'success' : u.status === 'pending' ? 'warning' : 'secondary'} size="sm">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.joined}</td>
                      <td className="py-3 px-4">
                        <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No users found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}