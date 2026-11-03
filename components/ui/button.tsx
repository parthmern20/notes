import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const base =
  "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium outline-none transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&_svg]:shrink-0"

const variants = {
  primary:
    "bg-primary text-primary-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-10px_var(--ring)] hover:bg-primary-hover",
  secondary: "border border-border bg-surface text-fg shadow-soft hover:border-border-strong hover:bg-surface-2",
  ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
  soft: "bg-primary-soft text-primary-ink hover:bg-[color-mix(in_oklab,var(--primary)_16%,transparent)]",
  danger: "bg-danger text-white shadow-soft hover:brightness-110",
  "danger-ghost": "text-danger-ink hover:bg-[color-mix(in_oklab,var(--danger)_10%,transparent)]",
} as const

const sizes = {
  xs: "h-7 gap-1 rounded-md px-2 text-xs [&_svg]:size-3.5",
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px] [&_svg]:size-4",
  md: "h-9 gap-2 rounded-[10px] px-3.5 text-sm [&_svg]:size-4",
  lg: "h-11 gap-2 rounded-xl px-5 text-[15px] [&_svg]:size-[18px]",
  icon: "size-9 rounded-[10px] [&_svg]:size-[18px]",
  "icon-sm": "size-8 rounded-lg [&_svg]:size-4",
  "icon-xs": "size-7 rounded-md [&_svg]:size-3.5",
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

export function buttonVariants({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
