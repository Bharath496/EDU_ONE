'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  Smartphone,
  Server,
} from 'lucide-react'

const QUICK_STATS = [
  { label: 'Total Colleges', value: '156', change: '+12 this month', trend: 'up', icon: Building2, color: 'blue' },
  { label: 'Active Users', value: '48,290', change: '+3,450 this month', trend: 'up', icon: Users, color: 'green' },
  { label: 'Monthly Revenue', value: '$245,000', change: '+15% vs last month', trend: 'up', icon: DollarSign, color: 'purple' },
  { label: 'Platform Uptime', value: '99.97%', change: '99.9% SLA met', trend: 'up', icon: Server, color: 'indigo' },
]

const RECENT_COLLEGES = [
  { name: 'PSG College of Technology', code: 'PSGCT', city: 'Coimbatore', status: 'active', students: '8,450', plan: 'Enterprise' },
  { name: 'SRM Institute of Technology', code: 'SRMIT', city: 'Chennai', status: 'active', students: '12,200', plan: 'Enterprise' },
  { name: 'VIT University', code: 'VIT', city: 'Vellore', status: 'active', students: '15,800', plan: 'Enterprise' },
  { name: 'St. Xavier College', code: 'SXC', city: 'Mumbai', status: 'pending', students: '3,200', plan: 'Pro' },
  { name: 'Delhi Public School', code: 'DPS', city: 'Delhi', status: 'active', students: '5,600', plan: 'Standard' },
]

const PLATFORM_ALERTS = [
  { type: 'info', title: 'New college onboarding request', desc: 'St. Xavier College, Mumbai - awaiting approval', time: '2 hours ago', icon: Building2 },
  { type: 'warning', title: 'Storage threshold reached', desc: 'Platform storage at 78% - consider upgrading', time: '1 day ago', icon: Server },
  { type: 'success', title: 'System update completed', desc: 'v3.2.1 deployed successfully across all regions', time: '2 days ago', icon: CheckCircle },
]

export default function AdminConsolePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>
  }

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <p className="text-sm text-slate-500">Super Admin</p>
            <h1 className="text-xl font-bold text-slate-900">Admin Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create College
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {QUICK_STATS.map((stat, i) => (
            <Card key={i} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                      <span className="text-sm font-medium text-green-600">{stat.change}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Colleges</CardTitle>
                  <CardDescription>Recently added and active institutions</CardDescription>
                </div>
                <Link href="/admin/colleges" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-2 font-medium text-slate-500">College</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Code</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">City</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Students</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Plan</th>
                        <th className="text-left py-3 px-2 font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_COLLEGES.map((college, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-2 font-medium text-slate-900">{college.name}</td>
                          <td className="py-3 px-2 text-slate-600">{college.code}</td>
                          <td className="py-3 px-2 text-slate-600">{college.city}</td>
                          <td className="py-3 px-2 text-slate-600">{college.students}</td>
                          <td className="py-3 px-2">
                            <Badge variant="primary" size="sm">{college.plan}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={college.status === 'active' ? 'success' : 'warning'} size="sm">
                              {college.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Platform management tasks</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { href: '/admin/colleges/new', icon: Plus, label: 'New College', desc: 'Onboard institution' },
                    { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'Platform users' },
                    { href: '/admin/billing', icon: CreditCard, label: 'Billing', desc: 'Subscriptions' },
                    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', desc: 'Platform metrics' },
                    { href: '/admin/settings', icon: Settings, label: 'Settings', desc: 'Global config' },
                  ].map((action) => (
                    <Link key={action.href} href={action.href} className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                        <action.icon className="w-5 h-5" />
                      </div>
                      <p className="font-medium text-slate-900">{action.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">Platform Alerts</CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {PLATFORM_ALERTS.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <alert.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                        <p className="text-sm text-slate-500">{alert.desc}</p>
                        <p className="text-xs text-slate-400 mt-1">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>Platform status overview</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {[
                  { label: 'API Response Time', value: '124ms', status: 'good' },
                  { label: 'Database Connections', value: '23/100', status: 'good' },
                  { label: 'Storage Used', value: '78%', status: 'warning' },
                  { label: 'Active Sessions', value: '2,340', status: 'good' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{item.value}</span>
                      <div className={`w-2 h-2 rounded-full ${item.status === 'good' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}