'use client'

import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X, Search, ChevronRight } from 'lucide-react'

interface CommandPaletteItemProps {
  href: string
  label: string
  description?: string
  icon?: ReactNode
  onSelect?: () => void
}

interface CommandPaletteSectionProps {
  label: string
  children: ReactNode
}

interface CommandPaletteProps {
  trigger: ReactNode
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function CommandPaletteItem({ href, label, description, icon, onSelect }: CommandPaletteItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onSelect?.()
    window.location.href = href
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
    >
      {icon && <span className="w-5 h-5 text-slate-400 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0 text-left">
        <span className="truncate block">{label}</span>
        {description && <span className="text-xs text-slate-500 truncate block">{description}</span>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </a>
  )
}

export function CommandPaletteSection({ label, children }: CommandPaletteSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</h3>
      {children}
    </div>
  )
}

export function CommandPalette({ trigger, isOpen, onClose, children }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => contentRef.current?.querySelector('input')?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return <>{trigger}</>

  const filteredChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    const childProps = child.props as { label?: string; children?: React.ReactNode }
    if (childProps.label) {
      const matchingItems = React.Children.toArray(childProps.children).filter((item: any) => {
        if (!React.isValidElement(item)) return false
        const itemProps = item.props as { label?: string; description?: string }
        const itemLabel = itemProps.label?.toLowerCase() || ''
        const itemDesc = itemProps.description?.toLowerCase() || ''
        return itemLabel.includes(query.toLowerCase()) || itemDesc.includes(query.toLowerCase())
      })
      if (matchingItems.length === 0) return null
      return React.cloneElement(child as React.ReactElement<any>, { children: matchingItems } as any)
    }
    return child
  })

  return (
    <>
      {trigger}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} role="presentation" aria-hidden="true" />
      <div
        ref={contentRef}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-3">
            {filteredChildren}
          </div>
        </div>
      </div>
    </>
  )
}

CommandPalette.Item = CommandPaletteItem
CommandPalette.Section = CommandPaletteSection