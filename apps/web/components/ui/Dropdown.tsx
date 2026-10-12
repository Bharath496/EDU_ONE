'use client'

import { forwardRef, type HTMLAttributes, useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownProps {
  trigger: ReactNode
  content: ReactNode
  align?: 'left' | 'right'
  offset?: number
  className?: string
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, content, align = 'right', offset = 4, className, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
            setOpen(false)
          }
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        <div
          ref={triggerRef}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
        >
          {trigger}
        </div>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              ref={contentRef}
              className={cn(
                'absolute z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-soft border border-slate-200 py-1 animate-slide-down',
                align === 'right' ? 'right-0' : 'left-0'
              )}
              style={{ marginTop: offset }}
            >
              {content}
            </div>
          </>
        )}
      </div>
    )
  }
)

Dropdown.displayName = 'Dropdown'

export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
}

const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('min-w-[180px]', className)} {...props}>
        {label && <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>}
        <div className="py-1">{children}</div>
      </div>
    )
  }
)

DropdownMenu.displayName = 'DropdownMenu'

export interface DropdownItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  description?: string
  danger?: boolean
  disabled?: boolean
}

const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, description, danger, disabled, children, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'w-full px-3 py-2.5 text-sm flex items-center gap-3 transition-colors rounded-lg',
          'text-slate-700 hover:bg-slate-50 focus:outline-none focus:bg-slate-50',
          danger && 'text-red-600 hover:bg-red-50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {icon && <span className="w-5 h-5 text-slate-400 flex-shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0 text-left">
          <span className="font-medium truncate block">{children}</span>
          {description && <span className="text-xs text-slate-500 truncate block">{description}</span>}
        </div>
      </button>
    )
  }
)

DropdownItem.displayName = 'DropdownItem'

const DropdownDivider = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr ref={ref} className={cn('my-1 border-slate-100', className)} {...props} />
  )
)

DropdownDivider.displayName = 'DropdownDivider'

// Create a compound component type
interface DropdownComponent extends React.ForwardRefExoticComponent<DropdownProps & React.RefAttributes<HTMLDivElement>> {
  Menu: typeof DropdownMenu
  Item: typeof DropdownItem
  Divider: typeof DropdownDivider
}

const DropdownCompound = Dropdown as DropdownComponent
DropdownCompound.Menu = DropdownMenu
DropdownCompound.Item = DropdownItem
DropdownCompound.Divider = DropdownDivider

export { DropdownCompound as Dropdown, DropdownMenu, DropdownItem, DropdownDivider }