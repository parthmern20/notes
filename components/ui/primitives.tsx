import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

const fieldBase =
  "w-full rounded-[10px] border border-border bg-surface px-3 text-sm text-fg shadow-soft outline-none transition-[border-color,box-shadow] placeholder:text-fg-3 hover:border-border-strong focus:border-primary focus:ring-4 focus:ring-[var(--primary-soft)] disabled:opacity-60"

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-9", className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 resize-y py-2 leading-relaxed", className)} {...props} />
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-[13px] font-medium text-fg-2", className)} {...props} />
}

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-fg-3">{hint}</p>}
    </div>
  )
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface shadow-card", className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-[18px]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-fg-3">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  )
}

const badgeTones = {
  neutral: "bg-surface-2 text-fg-2 border-border",
  primary: "bg-primary-soft text-primary-ink border-transparent",
  success: "bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-success-ink border-transparent",
  warning: "bg-[color-mix(in_oklab,var(--warning)_15%,transparent)] text-warning-ink border-transparent",
  danger: "bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] text-danger-ink border-transparent",
  info: "bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-info-ink border-transparent",
} as const

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[11.5px] font-medium [&_svg]:size-3",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  )
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border border-b-2 bg-surface-2 px-1 font-mono text-[10.5px] font-medium text-fg-2",
        className,
      )}
      {...props}
    />
  )
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("skeleton rounded-lg", className)} {...props} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/15 blur-2xl" />
        <div className="grid size-14 place-items-center rounded-2xl border border-border bg-surface text-primary-ink shadow-card [&_svg]:size-6">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-fg-3">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-fg-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
