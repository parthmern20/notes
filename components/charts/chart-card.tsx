"use client"

import { useState, type ReactNode } from "react"
import { ChartColumn, Table2, TrendingDown, TrendingUp } from "lucide-react"
import { cn, formatNumber } from "@/lib/utils"
import { AnimatedNumber, spotlightHandlers } from "@/components/motion/motion"
import { Card, CardHeader } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"

export interface TableData {
  columns: string[]
  rows: (string | number)[][]
}

export function DataTable({ columns, rows }: TableData) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-fg-3">No data yet.</p>
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-2 text-left text-xs text-fg-3">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={cn("px-3 py-2 font-medium", i > 0 && "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i} className={cn("px-3 py-1.5", i > 0 ? "text-right tabular-nums" : "text-fg-2")}>
                  {typeof cell === "number" ? formatNumber(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A chart's frame: title, optional actions and a Chart/Table toggle (the accessible twin of every chart). */
export function ChartCard({
  title,
  description,
  icon,
  action,
  table,
  dim,
  className,
  bodyClassName,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  table?: TableData
  dim?: boolean
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  const [view, setView] = useState<"chart" | "table">("chart")
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <CardHeader
        title={title}
        description={description}
        icon={icon}
        action={
          <>
            {action}
            {table && (
              <Segmented
                size="sm"
                value={view}
                onChange={setView}
                ariaLabel="Chart or table view"
                options={[
                  { value: "chart", label: <span className="sr-only">Chart</span>, icon: <ChartColumn /> },
                  { value: "table", label: <span className="sr-only">Table</span>, icon: <Table2 /> },
                ]}
              />
            )}
          </>
        }
      />
      <div className={cn("min-w-0 flex-1 px-5 pb-5 pt-4 transition-opacity duration-300", dim && "opacity-55", bodyClassName)}>
        {view === "table" && table ? <DataTable {...table} /> : children}
      </div>
    </Card>
  )
}

// ───────────── Stat tile ─────────────

export interface DeltaSpec {
  current: number
  previous: number
  /** Whether an increase is good news. */
  goodWhen?: "up" | "down"
  unit?: "percent" | "points"
  period: string
}

export function Delta({ current, previous, goodWhen = "up", unit = "percent", period }: DeltaSpec) {
  const diff = current - previous
  if (diff === 0) return <span className="text-xs text-fg-3">No change vs {period}</span>
  const up = diff > 0
  const good = goodWhen === "up" ? up : !up
  const Icon = up ? TrendingUp : TrendingDown
  const text =
    unit === "points"
      ? `${up ? "+" : "−"}${Math.abs(diff)} pts`
      : previous === 0
        ? `+${formatNumber(diff)}`
        : `${up ? "+" : "−"}${Math.round(Math.abs(diff / previous) * 100)}%`
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={cn("inline-flex items-center gap-0.5 font-semibold", good ? "text-[var(--delta-up)]" : "text-[var(--delta-down)]")}>
        <Icon className="size-3.5" />
        {text}
      </span>
      <span className="text-fg-3">vs {period}</span>
    </span>
  )
}

/** Sparkline in the de-emphasis hue with the latest point in the accent. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 104
  const h = 34
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - 4 - (v / max) * (h - 8)] as const)
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`-3 0 ${w + 6} ${h}`} className={cn("h-[34px] w-[110px] shrink-0 overflow-visible", className)} aria-hidden>
      <path d={d} fill="none" stroke="var(--chart-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.5" fill="var(--chart-accent)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  )
}

/** Compresses a daily series into at most `buckets` sums so sparklines stay readable. */
export function bucketize(values: number[], buckets = 12): number[] {
  if (values.length <= buckets) return values
  const size = values.length / buckets
  return Array.from({ length: buckets }, (_, i) =>
    values.slice(Math.floor(i * size), Math.floor((i + 1) * size)).reduce((a, b) => a + b, 0),
  )
}

export function StatTile({
  label,
  value,
  format = formatNumber,
  suffix,
  delta,
  spark,
  icon,
  selected,
  onSelect,
  hint,
}: {
  label: string
  value: number
  format?: (n: number) => string
  suffix?: string
  delta?: DeltaSpec
  spark?: number[]
  icon?: ReactNode
  selected?: boolean
  onSelect?: () => void
  hint?: ReactNode
}) {
  const interactive = Boolean(onSelect)
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-fg-2">{label}</span>
        {icon && (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg bg-surface-2 text-fg-3 transition-colors [&_svg]:size-4",
              selected && "bg-primary-soft text-primary-ink",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-1 text-[28px] font-semibold leading-none tracking-tight">
          <AnimatedNumber value={value} format={format} />
          {suffix && <span className="text-base font-medium text-fg-3">{suffix}</span>}
        </div>
        {spark && <Sparkline values={spark} />}
      </div>
      <div className="-mt-1 min-h-4 truncate">{delta ? <Delta {...delta} /> : hint && <span className="text-xs text-fg-3">{hint}</span>}</div>
    </>
  )
  const cls = cn(
    "spotlight relative flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition-[transform,box-shadow,border-color] duration-200",
    interactive && "hover:-translate-y-0.5 hover:shadow-pop",
    selected && "border-[color-mix(in_oklab,var(--primary)_45%,var(--border))] ring-4 ring-[var(--primary-soft)]",
  )
  return interactive ? (
    <button type="button" role="tab" aria-selected={selected} onClick={onSelect} className={cls} {...spotlightHandlers()}>
      {body}
    </button>
  ) : (
    <div className={cls} {...spotlightHandlers()}>
      {body}
    </div>
  )
}
