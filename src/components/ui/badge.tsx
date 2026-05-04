import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-primary/20 text-primary border-primary/30",
    secondary: "bg-muted text-muted-foreground border-muted",
    destructive: "bg-destructive/20 text-red-400 border-destructive/30",
    outline: "text-foreground border-border",
    success: "bg-success/20 text-emerald-400 border-success/30",
    warning: "bg-warning/20 text-amber-400 border-warning/30",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
