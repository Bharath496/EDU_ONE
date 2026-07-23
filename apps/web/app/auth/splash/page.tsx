'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Loader2, BookOpen, Shield, CheckCircle } from 'lucide-react'

export default function SplashScreen() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { label: 'Initializing...', duration: 800 },
    { label: 'Loading configuration...', duration: 600 },
    { label: 'Checking updates...', duration: 500 },
    { label: 'Preparing theme...', duration: 400 },
    { label: 'Ready', duration: 300 },
  ]

  useEffect(() => {
    let stepIndex = 0
    let progressValue = 0

    const runStep = () => {
      if (stepIndex >= steps.length) {
        setCurrentStep(steps.length)
        setProgress(100)
        setTimeout(() => {
          router.push('/auth/language')
        }, 500)
        return
      }

      setCurrentStep(stepIndex)
      const step = steps[stepIndex]
      const startProgress = (stepIndex / steps.length) * 100
      const endProgress = ((stepIndex + 1) / steps.length) * 100

      let elapsed = 0
      const interval = setInterval(() => {
        elapsed += 50
        const stepProgress = Math.min(elapsed / step.duration, 1)
        setProgress(startProgress + (endProgress - startProgress) * stepProgress)

        if (stepProgress >= 1) {
          clearInterval(interval)
          stepIndex++
          runStep()
        }
      }, 50)
    }

    runStep()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="w-24 h-24 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto animate-pulse">
          <BookOpen className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl font-bold text-white">EduOne</h1>
        <p className="text-primary-300 text-lg">Education Operating System</p>

        <div className="w-80 mx-auto space-y-4">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm">{steps[currentStep]?.label || 'Loading...'}</p>
        </div>

        <div className="flex items-center justify-center gap-8 text-slate-500 text-sm">
          <div className={cn('flex items-center gap-2', currentStep > 0 && 'text-primary-400')}>
            <CheckCircle className="w-4 h-4" />
            <span>Config</span>
          </div>
          <div className={cn('flex items-center gap-2', currentStep > 1 && 'text-primary-400')}>
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </div>
          <div className={cn('flex items-center gap-2', currentStep > 2 && 'text-primary-400')}>
            <CheckCircle className="w-4 h-4" />
            <span>Theme</span>
          </div>
        </div>
      </div>
    </div>
  )
}