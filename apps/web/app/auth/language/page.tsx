'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Globe, ChevronRight, CheckCircle } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', rtl: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', rtl: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', rtl: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', rtl: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', rtl: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', rtl: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', rtl: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
]

function LanguagePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(search.toLowerCase())
  )

  const handleContinue = () => {
    localStorage.setItem('preferred-language', selectedLanguage)
    router.push('/auth/institution')
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
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Choose Your Language</h1>
          <p className="text-slate-600 mt-2">Select your preferred language to continue</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Languages</CardTitle>
            <CardDescription>Search or select from the list</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4',
                    selectedLanguage === lang.code
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                  )}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{lang.name}</p>
                    <p className="text-sm text-slate-500 truncate">{lang.nativeName}</p>
                  </div>
                  {selectedLanguage === lang.code && (
                    <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleContinue}
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/auth/splash" className="text-sm text-slate-600 hover:text-primary-600 flex items-center justify-center gap-1">
            <span>Skip for now</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LanguagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <p className="text-slate-500">Loading languages...</p>
        </div>
      </div>
    }>
      <LanguagePageContent />
    </Suspense>
  )
}