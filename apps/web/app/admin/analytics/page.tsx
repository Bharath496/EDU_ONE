'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/lib/auth-store'
import { BarChart3, TrendingUp, TrendingDown, Download, ChevronRight, Users, Building2, DollarSign, Activity, Globe, Smartphone, Monitor } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-xl bg-primary-600 animate-pulse" /></div>

  if (!isAuthenticated || !user || user.role !== 'Super Admin') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin" className="hover:text-primary-600">Admin</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">Analytics</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Platform Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: 'Total Users', value: '48,290', change: '+8.5%', trend: 'up', icon: Users, color: 'blue' },
            { label: 'Active Colleges', value: '142', change: '+5.2%', trend: 'up', icon: Building2, color: 'green' },
            { label: 'Avg Users/College', value: '340', change: '+3.1%', trend: 'up', icon: Activity, color: 'purple' },
            { label: 'Growth Rate', value: '12.4%', change: '+2.1% MoM', trend: 'up', icon: TrendingUp, color: 'indigo' },
          ].map((stat, i) => (
            <Card key={i} className="hover:shadow-soft transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === 'up' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Geographic Distribution</CardTitle>
              <CardDescription>Colleges by region</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {[
                { region: 'Tamil Nadu', count: 42, percentage: 27 },
                { region: 'Maharashtra', count: 28, percentage: 18 },
                { region: 'Karnataka', count: 22, percentage: 14 },
                { region: 'Delhi NCR', count: 18, percentage: 12 },
                { region: 'Rajasthan', count: 12, percentage: 8 },
                { region: 'Other States', count: 34, percentage: 21 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-28 text-sm text-slate-600">{item.region}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-900">{item.count}</span>
                    <span className="text-slate-400">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Platform Adoption</CardTitle>
              <CardDescription>Feature usage across colleges</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {[
                { feature: 'Attendance', usage: 94, color: 'green' },
                { feature: 'Student Management', usage: 91, color: 'blue' },
                { feature: 'Exam Management', usage: 78, color: 'purple' },
                { feature: 'Fee Management', usage: 72, color: 'amber' },
                { feature: 'Library', usage: 65, color: 'indigo' },
                { feature: 'Communication', usage: 58, color: 'cyan' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-40 text-sm text-slate-600">{item.feature}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${item.usage}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-10 text-right">{item.usage}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Device Breakdown</CardTitle>
              <CardDescription>User access by device type</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {[
                { device: 'Desktop', icon: Monitor, percentage: 52, users: '25,100' },
                { device: 'Mobile', icon: Smartphone, percentage: 38, users: '18,350' },
                { device: 'Tablet', icon: Globe, percentage: 10, users: '4,840' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.device}</span>
                      <span className="font-medium text-slate-900">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.users} users</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Growth Trends</CardTitle>
              <CardDescription>User and college growth over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 font-medium text-slate-500">Month</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">New Colleges</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">New Users</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Revenue</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { month: 'Jul 2024', colleges: 8, users: 3450, revenue: '$245K', growth: '+15%' },
                      { month: 'Jun 2024', colleges: 6, users: 2800, revenue: '$213K', growth: '+12%' },
                      { month: 'May 2024', colleges: 5, users: 2400, revenue: '$190K', growth: '+10%' },
                      { month: 'Apr 2024', colleges: 7, users: 3100, revenue: '$173K', growth: '+14%' },
                      { month: 'Mar 2024', colleges: 4, users: 1900, revenue: '$152K', growth: '+8%' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 font-medium text-slate-900">{row.month}</td>
                        <td className="py-3 px-2 text-right text-slate-600">{row.colleges}</td>
                        <td className="py-3 px-2 text-right text-slate-600">{row.users.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-900">{row.revenue}</td>
                        <td className="py-3 px-2 text-right text-green-600">{row.growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}