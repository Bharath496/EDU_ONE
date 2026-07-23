'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/lib/auth-store'
import { Building2, Plus, Search, ChevronRight, MoreHorizontal, MapPin, Users, CreditCard, Globe, Filter, Download } from 'lucide-react'

const COLLEGES = [
  { id: '1', name: 'PSG College of Technology', code: 'PSGCT', city: 'Coimbatore', state: 'Tamil Nadu', students: 8450, plan: 'Enterprise', status: 'active', joined: 'Jan 2023', adminName: 'Dr. K. Prakasan' },
  { id: '2', name: 'SRM Institute of Technology', code: 'SRMIT', city: 'Chennai', state: 'Tamil Nadu', students: 12200, plan: 'Enterprise', status: 'active', joined: 'Mar 2023', adminName: 'Dr. R. Ramesh' },
  { id: '3', name: 'VIT University', code: 'VIT', city: 'Vellore', state: 'Tamil Nadu', students: 15800, plan: 'Enterprise', status: 'active', joined: 'Feb 2023', adminName: 'Dr. G. Viswanathan' },
  { id: '4', name: 'St. Xavier College', code: 'SXC', city: 'Mumbai', state: 'Maharashtra', students: 3200, plan: 'Pro', status: 'pending', joined: 'Jul 2024', adminName: 'Fr. John Pereira' },
  { id: '5', name: 'Delhi Public School', code: 'DPS', city: 'Delhi', state: 'Delhi', students: 5600, plan: 'Standard', status: 'active', joined: 'Jun 2023', adminName: 'Mr. Ashok Kumar' },
  { id: '6', name: 'Christ University', code: 'CU', city: 'Bangalore', state: 'Karnataka', students: 9800, plan: 'Enterprise', status: 'active', joined: 'Apr 2023', adminName: 'Dr. Joseph Xavier' },
  { id: '7', name: 'BITS Pilani', code: 'BITSP', city: 'Pilani', state: 'Rajasthan', students: 7200, plan: 'Enterprise', status: 'active', joined: 'Jan 2023', adminName: 'Dr. S. S. Rao' },
  { id: '8', name: 'Symbiosis International University', code: 'SIU', city: 'Pune', state: 'Maharashtra', students: 11000, plan: 'Pro', status: 'inactive', joined: 'May 2023', adminName: 'Dr. Vidya Yeravdekar' },
]

export default function CollegesPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()
  const [search, setSearch] = useState('')

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  const filtered = COLLEGES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Colleges</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Colleges</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Link href="/admin/colleges/new">
              <Button variant="primary" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add College
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleges by name, code, or city..."
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(college => (
            <Card key={college.id} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant={college.status === 'active' ? 'success' : college.status === 'pending' ? 'warning' : 'secondary'} size="sm">
                    {college.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900">{college.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{college.code} • {college.city}, {college.state}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{college.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{college.plan}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Admin: {college.adminName} • Joined {college.joined}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No colleges found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}