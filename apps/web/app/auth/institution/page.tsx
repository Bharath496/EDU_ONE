'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  Building2,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  ClipboardList,
  FilePen,
  Library,
  IndianRupee,
  Megaphone,
  FileText,
  Settings,
  Shield,
  Search,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'

const institutions = [
  { id: 'psg-arts', name: 'PSG College of Arts and Science', code: 'PSGAS', city: 'Coimbatore', logo: '🏛️', color: 'bg-blue-500' },
  { id: 'psg-tech', name: 'PSG College of Technology', code: 'PSGCT', city: 'Coimbatore', logo: '🏫', color: 'bg-indigo-500' },
  { id: 'kct', name: 'Kumaraguru College of Technology', code: 'KCT', city: 'Coimbatore', logo: '🏭', color: 'bg-green-500' },
  { id: 'skasc', name: 'Sri Krishna Arts and Science College', code: 'SKASC', city: 'Coimbatore', logo: '🏛️', color: 'bg-purple-500' },
  { id: 'skcet', name: 'Sri Krishna College of Engineering and Technology', code: 'SKCET', city: 'Coimbatore', logo: '🏭', color: 'bg-orange-500' },
  { id: 'rathinam', name: 'Rathinam College of Arts and Science', code: 'RCAS', city: 'Coimbatore', logo: '🏛️', color: 'bg-pink-500' },
  { id: 'cit', name: 'Coimbatore Institute of Technology', code: 'CIT', city: 'Coimbatore', logo: '🏭', color: 'bg-red-500' },
  { id: 'drngp', name: 'Dr. N.G.P. Arts and Science College', code: 'DRNGP', city: 'Coimbatore', logo: '🏛️', color: 'bg-teal-500' },
  { id: 'sns', name: 'SNS College of Technology', code: 'SNSC', city: 'Coimbatore', logo: '🏭', color: 'bg-cyan-500' },
  { id: 'other', name: 'Other Institution', code: 'OTHER', city: '', logo: '➕', color: 'bg-slate-500' },
]

const popularInstitutions = [
  { id: 'psg-tech', name: 'PSG College of Technology', code: 'PSGCT', city: 'Coimbatore' },
  { id: 'psg-arts', name: 'PSG College of Arts and Science', code: 'PSGAS', city: 'Coimbatore' },
  { id: 'kct', name: 'Kumaraguru College of Technology', code: 'KCT', city: 'Coimbatore' },
  { id: 'skcet', name: 'Sri Krishna College of Engineering', code: 'SKCET', city: 'Coimbatore' },
]

export default function InstitutionPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(search.toLowerCase()) ||
    inst.city.toLowerCase().includes(search.toLowerCase()) ||
    inst.code.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (inst: typeof institutions[0]) => {
    setSelectedInstitution(inst.id)
    if (inst.id === 'other') return
    router.push(`/auth/role?institution=${encodeURIComponent(inst.id)}`)
  }

  const handleContinue = () => {
    if (selectedInstitution && customName.trim()) {
      router.push(`/auth/role?institution=${encodeURIComponent(selectedInstitution)}&custom=${encodeURIComponent(customName.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">E</span>
            </div>
            <span className="text-3xl font-bold text-slate-900">EduOne</span>
          </Link>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Select Your Institution</h1>
          <p className="text-slate-600 mt-2">Choose your college or university to continue</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Search Institutions</CardTitle>
            <CardDescription>Type to filter by name, city, or code</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              placeholder="Search institutions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="mb-6"
            />

            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Popular Institutions</h3>
              {popularInstitutions.map(inst => {
                const fullInst = institutions.find(i => i.id === inst.id)!
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSelect(fullInst)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4',
                      selectedInstitution === inst.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl', fullInst.color)}>
                      {fullInst.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{inst.name}</p>
                      <p className="text-sm text-slate-500">{inst.code} • {inst.city}</p>
                    </div>
                    {selectedInstitution === inst.id && (
                      <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">All Institutions</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredInstitutions.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => handleSelect(inst)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4',
                      selectedInstitution === inst.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl', inst.color)}>
                      {inst.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{inst.name}</p>
                      <p className="text-sm text-slate-500">{inst.code} • {inst.city}</p>
                    </div>
                    {selectedInstitution === inst.id && (
                      <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedInstitution === 'other' && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-slide-down">
                <h4 className="font-medium text-slate-900 mb-3">Enter Institution Details</h4>
                <Input
                  placeholder="Institution Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  leftIcon={<Building2 className="w-5 h-5" />}
                  className="mb-4"
                />
                <Button className="w-full" size="lg" onClick={handleContinue} disabled={!customName.trim()}>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {(selectedInstitution && selectedInstitution !== 'other') && (
              <div className="mt-6">
                <Button className="w-full" size="lg" onClick={() => router.push(`/auth/role?institution=${encodeURIComponent(selectedInstitution)}`)}>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-600 hover:text-primary-600 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}