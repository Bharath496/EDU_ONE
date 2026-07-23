'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  GraduationCap,
  UserCheck,
  Users,
  Shield,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  Building2,
} from 'lucide-react'

const roles = [
  {
    id: 'student',
    name: 'Student',
    description: 'Access your courses, attendance, grades, and assignments',
    icon: GraduationCap,
    color: 'bg-indigo-500',
    permissions: ['View courses', 'Submit assignments', 'Check grades', 'Track attendance'],
  },
  {
    id: 'faculty',
    name: 'Faculty',
    description: 'Manage classes, mark attendance, grade assignments',
    icon: UserCheck,
    color: 'bg-green-500',
    permissions: ['Mark attendance', 'Create assignments', 'Grade submissions', 'Manage classes'],
  },
  {
    id: 'parent',
    name: 'Parent',
    description: "Monitor your child's progress, attendance, and fees",
    icon: Users,
    color: 'bg-orange-500',
    permissions: ["View child's grades", "Track attendance", "Monitor fees", "Receive alerts"],
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Administrative and operational access',
    icon: Shield,
    color: 'bg-blue-500',
    permissions: ['Manage records', 'Process fees', 'Send notices', 'Generate reports'],
  },
]

const institutionNames: Record<string, string> = {
  'psg-arts': 'PSG College of Arts and Science',
  'psg-tech': 'PSG College of Technology',
  'kct': 'Kumaraguru College of Technology',
  'skasc': 'Sri Krishna Arts and Science College',
  'skcet': 'Sri Krishna College of Engineering and Technology',
  'rathinam': 'Rathinam College of Arts and Science',
  'cit': 'Coimbatore Institute of Technology',
  'drngp': 'Dr. N.G.P. Arts and Science College',
  'sns': 'SNS College of Technology',
}

function RolePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const institutionId = searchParams.get('institution') || 'psg-tech'
  const customName = searchParams.get('custom')
  const institutionName = customName || institutionNames[institutionId] || 'Unknown Institution'
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const availableRoles = roles

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth/2fa?role=${selectedRole}&institution=${institutionId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/auth/institution" className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-primary-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Change Institution</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <p className="text-sm text-slate-500">Institution</p>
              <p className="font-semibold text-slate-900 truncate max-w-xs">{institutionName}</p>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Select Your Role</h1>
          <p className="text-slate-600 mt-2">Choose how you want to access {institutionName}</p>
        </div>

        <div className="space-y-3">
          {availableRoles.map(role => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'w-full p-5 rounded-xl border-2 transition-all text-left flex items-start gap-4',
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                )}
              >
                <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', role.color)}>
                  <Icon className="text-white" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{role.name}</h3>
                    {isSelected && <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />}
                  </div>
                  <p className="text-slate-600 mb-3">{role.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <Button
            className="w-full"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            Continue to Verification
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/auth/institution" className="text-sm text-slate-600 hover:text-primary-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Institution Selection
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <p className="text-slate-500">Loading roles...</p>
        </div>
      </div>
    }>
      <RolePageContent />
    </Suspense>
  )
}