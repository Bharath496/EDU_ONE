import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, format: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    'Super Admin': 'bg-purple-100 text-purple-700',
    'College Admin': 'bg-blue-100 text-blue-700',
    'Faculty': 'bg-green-100 text-green-700',
    'Student': 'bg-indigo-100 text-indigo-700',
    'Parent': 'bg-orange-100 text-orange-700',
  }
  return colors[role] || 'bg-slate-100 text-slate-700'
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    'Super Admin': 'bg-purple-500',
    'College Admin': 'bg-blue-500',
    'Faculty': 'bg-green-500',
    'Student': 'bg-indigo-500',
    'Parent': 'bg-orange-500',
  }
  return colors[role] || 'bg-slate-500'
}