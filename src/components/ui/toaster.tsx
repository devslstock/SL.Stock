import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

let toastId = 0
let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null

export const toast = {
  success: (message: string, opts?: { duration?: number }) =>
    addToastFn?.({ message, type: 'success', duration: opts?.duration || 3000 }),
  error: (message: string, opts?: { duration?: number }) =>
    addToastFn?.({ message, type: 'error', duration: opts?.duration || 4000 }),
  info: (message: string, opts?: { duration?: number }) =>
    addToastFn?.({ message, type: 'info', duration: opts?.duration || 2500 }),
  warning: (message: string, opts?: { duration?: number }) =>
    addToastFn?.({ message, type: 'warning', duration: opts?.duration || 4000 }),
}

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-primary/30 bg-primary/10 text-indigo-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id))
    }, t.duration)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md slide-up",
              styles[t.type]
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
