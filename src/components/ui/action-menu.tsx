import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from './button'

interface ActionMenuProps {
  children: ReactNode
  icon?: ReactNode
  label?: string
}

export function ActionMenu({ children, icon = <Menu className="h-5 w-5" />, label }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left w-full sm:w-auto" ref={menuRef}>
      <Button 
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto shadow-sm text-primary border-primary hover:bg-primary/10 gap-2 h-10 px-4 py-2"
      >
        {icon}
        {label && <span>{label}</span>}
      </Button>
      {isOpen && (
        <div 
          className="absolute right-0 sm:right-0 mt-2 min-w-[200px] w-full sm:w-auto rounded-md shadow-lg bg-background border border-border z-50 flex flex-col p-1 animate-in slide-in-from-top-2 origin-top-right"
          onClick={() => setIsOpen(false)} // Fecha o menu ao clicar em qualquer item
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function ActionMenuItem({ onClick, children, className = '', disabled = false }: { onClick?: () => void, children: ReactNode, className?: string, disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-muted/80 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
