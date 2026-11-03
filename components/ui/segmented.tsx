"use client"

import { useId, type ReactNode } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface Option<V extends string> {
  value: V
  label: ReactNode
  icon?: ReactNode
  count?: number
}

const spring = { type: "spring", bounce: 0.18, duration: 0.45 } as const

/** Pill-style segmented control; the active highlight glides between options. */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  ariaLabel,
}: {
  value: V
  onChange: (value: V) => void
  options: Option<V>[]
  className?: string
  size?: "sm" | "md"
  ariaLabel?: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-0.5 rounded-[11px] border border-border bg-surface-2 p-0.5", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative isolate inline-flex items-center gap-1.5 rounded-[9px] font-medium transition-colors [&_svg]:size-3.5",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "text-fg" : "text-fg-3 hover:text-fg-2",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring}
                className="absolute inset-0 -z-10 rounded-[9px] border border-border bg-surface shadow-soft"
              />
            )}
            {o.icon}
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[10.5px] tabular-nums", active ? "bg-primary-soft text-primary-ink" : "bg-surface-3")}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Underlined tabs with a sliding indicator. */
export function Tabs<V extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: V
  onChange: (value: V) => void
  items: Option<V>[]
  className?: string
}) {
  const id = useId()
  return (
    <div role="tablist" className={cn("flex items-center gap-1 overflow-x-auto border-b border-border", className)}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative inline-flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors [&_svg]:size-4",
              active ? "text-fg" : "text-fg-3 hover:text-fg-2",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                  active ? "bg-primary-soft text-primary-ink" : "bg-surface-2 text-fg-3",
                )}
              >
                {t.count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={`tab-${id}`}
                transition={spring}
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
