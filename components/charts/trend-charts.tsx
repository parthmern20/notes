"use client"

import { useId } from "react"
import { format } from "date-fns"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"
import { keyToLocalDate } from "@/lib/dates"
import { formatNumber } from "@/lib/utils"

const axisTick = { fill: "var(--fg-3)", fontSize: 11 }

interface TipRow {
  value: string
  label: string
}

function TooltipCard({ title, rows }: { title: string; rows: TipRow[] }) {
  return (
    <div className="min-w-36 rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <div className="mb-1 text-[11px] text-fg-3">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-xs">
          <span className="h-0.5 w-3 rounded-full bg-[var(--chart-accent)]" />
          <span className="font-semibold tabular-nums text-fg">{r.value}</span>
          <span className="text-fg-3">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

export interface TrendPoint {
  date: string
  /** null = no data that day (drawn as a gap bridged by the line). */
  value: number | null
}

/** Single-series trend (no legend: the card title names it), crosshair + tooltip on hover. */
export function TrendChart({
  data,
  label,
  formatValue = formatNumber,
  height = 240,
  domain,
}: {
  data: TrendPoint[]
  label: string
  formatValue?: (n: number) => string
  height?: number
  domain?: [number, number]
}) {
  const gid = useId().replace(/:/g, "")
  const dense = data.length > 31
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: "var(--chart-axis)" }}
            tick={axisTick}
            tickMargin={8}
            minTickGap={dense ? 36 : 22}
            tickFormatter={(d: string) => format(keyToLocalDate(d), data.length > 8 ? "MMM d" : "EEE")}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            allowDecimals={false}
            domain={domain}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
            content={({ active, payload, label: d }: TooltipContentProps) =>
              active && payload?.length ? (
                <TooltipCard
                  title={format(keyToLocalDate(String(d)), "EEEE, MMM d")}
                  rows={[
                    payload[0].value === null || payload[0].value === undefined
                      ? { value: "—", label: "no reviews" }
                      : { value: formatValue(Number(payload[0].value)), label },
                  ]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke="var(--chart-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            fill={`url(#fill-${gid})`}
            activeDot={{ r: 4.5, fill: "var(--chart-accent)", stroke: "var(--surface)", strokeWidth: 2 }}
            connectNulls
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface ForecastPoint {
  date: string
  notes: number
  cards: number
}

/** Upcoming reviews per day: one series (notes + cards), breakdown in the tooltip. */
export function ForecastChart({ data, height = 220 }: { data: ForecastPoint[]; height?: number }) {
  const rows = data.map((d, i) => ({ ...d, total: d.notes + d.cards, label: i === 0 ? "Today" : format(keyToLocalDate(d.date), "EEE d") }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--chart-axis)" }} tick={axisTick} tickMargin={8} interval="preserveStartEnd" minTickGap={14} />
          <YAxis width={44} tickLine={false} axisLine={false} tick={axisTick} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)", radius: 6 }}
            content={({ active, payload }: TooltipContentProps) => {
              const p = active ? (payload?.[0]?.payload as (typeof rows)[number] | undefined) : undefined
              return p ? (
                <TooltipCard
                  title={p.label === "Today" ? "Today (incl. overdue)" : format(keyToLocalDate(p.date), "EEEE, MMM d")}
                  rows={[
                    { value: formatNumber(p.total), label: "due" },
                    { value: formatNumber(p.notes), label: "notes" },
                    { value: formatNumber(p.cards), label: "flashcards" },
                  ]}
                />
              ) : null
            }}
          />
          <Bar dataKey="total" name="Due" fill="var(--chart-accent)" radius={[4, 4, 0, 0]} maxBarSize={24} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
