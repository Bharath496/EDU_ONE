'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
}

const badgeStyles = {
  base: 'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors',
  variants: {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    outline: 'bg-transparent border border-slate-200 text-slate-600 hover:bg-slate-50',
  },
  sizes: {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  },
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          badgeStyles.base,
          badgeStyles.variants[variant],
          badgeStyles.sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', dotColor ? `bg-[${dotColor}]` : 'bg-current')}
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dotColor: string }> = {
  active: { variant: 'success', label: 'Active', dotColor: '#10b981' },
  inactive: { variant: 'default', label: 'Inactive', dotColor: '#9ca3af' },
  pending: { variant: 'warning', label: 'Pending', dotColor: '#f59e0b' },
  approved: { variant: 'success', label: 'Approved', dotColor: '#10b981' },
  rejected: { variant: 'danger', label: 'Rejected', dotColor: '#ef4444' },
  draft: { variant: 'secondary', label: 'Draft', dotColor: '#64748b' },
  published: { variant: 'primary', label: 'Published', dotColor: '#6366f1' },
  archived: { variant: 'default', label: 'Archived', dotColor: '#9ca3af' },
  present: { variant: 'success', label: 'Present', dotColor: '#10b981' },
  absent: { variant: 'danger', label: 'Absent', dotColor: '#ef4444' },
  late: { variant: 'warning', label: 'Late', dotColor: '#f59e0b' },
  excused: { variant: 'primary', label: 'Excused', dotColor: '#6366f1' },
  paid: { variant: 'success', label: 'Paid', dotColor: '#10b981' },
  partial: { variant: 'warning', label: 'Partial', dotColor: '#f59e0b' },
  overdue: { variant: 'danger', label: 'Overdue', dotColor: '#ef4444' },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || { variant: 'default', label: status, dotColor: '#9ca3af' }
  return <Badge variant={config.variant} size={size} dot dotColor={config.dotColor}>{config.label}</Badge>
}