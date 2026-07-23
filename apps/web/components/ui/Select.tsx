'use client'

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X, Check } from 'lucide-react'

interface SelectContextType {
  value: string
  setValue: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  multiple: boolean
  searchable: boolean
  disabled: boolean
  placeholder: string
}

const SelectContext = createContext<SelectContextType | null>(null)

interface SelectProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  searchable?: boolean
  options: SelectOption[]
  className?: string
  name?: string
  required?: boolean
  error?: string
  label?: string
}

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: ReactNode
  description?: string
}

export function Select({
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  multiple = false,
  searchable = false,
  options,
  className,
  name,
  required = false,
  error,
  label,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '')
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const currentValue = value !== undefined ? value : internalValue

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
    if (!multiple) {
      setOpen(false)
    }
  }

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        setValue: handleChange,
        open,
        setOpen,
        multiple,
        searchable,
        disabled,
        placeholder,
      }}
    >
      <div className={cn('w-full', className)} ref={triggerRef}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor={name}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <button
          type="button"
          id={name}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={name ? `${name}-listbox` : undefined}
          disabled={disabled}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200',
            'bg-white text-slate-900',
            disabled ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'border-slate-200 hover:border-slate-300',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'focus:border-primary-500 focus:ring-primary-200',
            'focus:outline-none focus:ring-2'
          )}
        >
          <span className={cn('truncate flex-1', currentValue ? 'text-slate-900' : 'text-slate-400')}>
            {currentValue
              ? options.find((opt) => opt.value === currentValue)?.label || currentValue
              : placeholder}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>

        {error && <p className="mt-1.5 text-sm text-red-600" role="alert">{error}</p>}

        {open && (
          <div
            ref={contentRef}
            id={name ? `${name}-listbox` : undefined}
            role="listbox"
            className="absolute z-50 w-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden animate-slide-down"
          >
            {searchable && (
              <div className="p-3 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No options match your search' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={currentValue === option.value}
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleChange(option.value)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-colors',
                      'text-left',
                      currentValue === option.value
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700 hover:bg-slate-50',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && <span className="w-4 h-4 text-slate-400">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-slate-500 truncate block">{option.description}</span>
                      )}
                    </div>
                    {currentValue === option.value && (
                      <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </SelectContext.Provider>
  )
}

export function useSelect() {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('useSelect must be used within a Select component')
  }
  return context
}