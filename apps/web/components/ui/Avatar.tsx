'use client'

import React, { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  shape?: 'circle' | 'square'
  status?: 'online' | 'offline' | 'busy' | 'away'
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
}

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

const statusPositionClasses = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', status, statusPosition = 'bottom-right', ...props }, ref) => {
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'
    const sizeClass = sizeClasses[size]
    const statusSizeClass = statusSizes[size]

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        <div className={cn(sizeClass, shapeClass, 'overflow-hidden bg-slate-100 flex items-center justify-center')}>
          {src ? (
            <img
              src={src}
              alt={alt || name || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : name ? (
            <span className="font-medium text-slate-600">{getInitials(name)}</span>
          ) : (
            <svg className="w-1/2 h-1/2 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-3.007A12.994 12.994 0 0112 15c3.317 0 6.361 1.272 8.657 3.382.12.114.25.213.38.3a.996.996 0 001.4 0c.13-.088.26-.187.38-.3A13.065 13.065 0 0124 20.993zM16 14c0-3.314-2.686-6-6-6S4 10.686 4 14c0 2.84 2.137 5.217 5 5.653V17h2v2.653C13.863 19.217 16 16.84 16 14z" />
            </svg>
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute border-2 border-white rounded-full',
              statusColors[status],
              statusSizeClass,
              statusPositionClasses[statusPosition]
            )}
            aria-label={status}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

const groupSizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: AvatarProps['size']
  overlap?: number
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 5, size = 'md', overlap = -8, ...props }, ref) => {
    const kids = React.Children.toArray(children)
    const visible = kids.slice(0, max)
    const remaining = kids.length - max

    return (
      <div ref={ref} className={cn('flex items-center', className)} {...props}>
        <div className="flex -space-x-1" style={{ marginLeft: 0 }}>
          {visible.map((child, index) =>
            React.isValidElement(child) ? (
              React.cloneElement(child as React.ReactElement<any>, {
                key: child.key || index,
                size,
                className: cn(
                  child.props.className,
                  index === 0 ? 'z-10' : '',
                  index > 0 && 'ring-2 ring-white'
                ),
                style: {
                  ...child.props.style,
                  zIndex: visible.length - index,
                  marginLeft: index > 0 ? overlap : 0,
                },
              })
            ) : null
          )}
        </div>
        {remaining > 0 && (
          <div
            className={cn(
              groupSizeClasses[size],
              'rounded-full',
              'bg-primary-100 text-primary-700 font-medium flex items-center justify-center border-2 border-white'
            )}
            style={{ marginLeft: overlap }}
          >
            +{remaining}
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'