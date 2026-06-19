import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: React.ReactNode
  type: ToastType
  duration: number
  action?: ToastAction
}

let toastId = 0
let addToastFn: ((toast: Omit<Toast, 'id'>) => void) | null = null

export const toast = {
  success: (message: React.ReactNode, opts?: { duration?: number, action?: ToastAction }) =>
    addToastFn?.({ message, type: 'success', duration: opts?.duration ?? 3000, action: opts?.action }),
  error: (message: React.ReactNode, opts?: { duration?: number, action?: ToastAction }) =>
    addToastFn?.({ message, type: 'error', duration: opts?.duration ?? 4000, action: opts?.action }),
  info: (message: React.ReactNode, opts?: { duration?: number, action?: ToastAction }) =>
    addToastFn?.({ message, type: 'info', duration: opts?.duration ?? 2500, action: opts?.action }),
  warning: (message: React.ReactNode, opts?: { duration?: number, action?: ToastAction }) =>
    addToastFn?.({ message, type: 'warning', duration: opts?.duration ?? 4000, action: opts?.action }),
}

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-600 dark:text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'border-primary/30 bg-primary/10 text-primary dark:text-indigo-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-600 dark:text-amber-400',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId
    setToasts(prev => [...prev, { ...t, id }])
    if (t.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id))
      }, t.duration)
    }
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
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-sm font-medium">{t.message}</span>
              {t.action && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { t.action!.onClick(); removeToast(t.id); }}
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                  >
                    {t.action.label}
                  </button>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
            {!t.action && (
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer ml-2 self-start mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
