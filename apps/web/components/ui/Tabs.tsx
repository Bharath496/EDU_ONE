'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  variant: 'default' | 'pills' | 'underline' | 'card'
}

const TabsContext = createContext<TabsContextType | null>(null)

interface TabsProps {
  children: ReactNode
  defaultValue: string
  value?: string
  onChange?: (value: string) => void
  variant?: 'default' | 'pills' | 'underline' | 'card'
  className?: string
}

export function Tabs({ children, defaultValue, value, onChange, variant = 'default', className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(value || defaultValue)

  const handleChange = (tab: string) => {
    if (value === undefined) {
      setActiveTab(tab)
    }
    onChange?.(tab)
  }

  const contextValue = {
    activeTab: value || activeTab,
    setActiveTab: handleChange,
    variant,
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
  ariaLabel?: string
}

export function TabsList({ children, className, ariaLabel = 'Tabs' }: TabsListProps) {
  const { variant } = useContext(TabsContext)!

  const listStyles = {
    default: 'flex gap-1 bg-slate-100 rounded-xl p-1',
    pills: 'flex gap-2',
    underline: 'flex gap-6 border-b border-slate-200',
    card: 'flex gap-0',
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn(listStyles[variant], className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
  icon?: ReactNode
  badge?: number | string
}

export function TabsTrigger({ value, children, disabled, className, icon, badge }: TabsTriggerProps) {
  const { activeTab, setActiveTab, variant } = useContext(TabsContext)!
  const isActive = activeTab === value

  const triggerStyles = {
    default: cn(
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-white text-primary-600 shadow-sm'
        : 'text-slate-600 hover:text-slate-900',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    pills: cn(
      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-primary-600 text-white shadow-soft'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    underline: cn(
      'px-1 py-3 border-b-2 text-sm font-medium transition-all duration-200 -mb-px',
      isActive
        ? 'border-primary-600 text-primary-600'
        : 'border-transparent text-slate-500 hover:text-slate-700',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    card: cn(
      'flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-slate-200',
      isActive
        ? 'bg-primary-50 border-primary-200 text-primary-700'
        : 'bg-white text-slate-600 hover:bg-slate-50',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
  }

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(triggerStyles[variant], 'flex items-center justify-center gap-2', className)}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
      {badge && (
        <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

interface TabsContentProps {
  children: ReactNode
  className?: string
}

export function TabsContent({ children, className }: TabsContentProps) {
  const { activeTab, variant } = useContext(TabsContext)!

  const contentStyles = {
    default: '',
    pills: '',
    underline: 'pt-4',
    card: 'pt-4',
  }

  return (
    <div
      role="tabpanel"
      className={cn(contentStyles[variant], 'animate-fade-in', className)}
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
    >
      {children}
    </div>
  )
}

interface TabPanelProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)!

  if (activeTab !== value) return null

  return (
    <TabsContent className={className}>
      {children}
    </TabsContent>
  )
}