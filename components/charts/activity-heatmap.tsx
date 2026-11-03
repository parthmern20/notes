"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { format } from "date-fns"
import { keyToLocalDate } from "@/lib/dates"
import { cn } from "@/lib/utils"

const CELL = 13
const GAP = 3
const LABEL_W = 30
const LEVEL_VARS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"]

interface Day {
  date: string
  count: number
}

function levelOf(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0
  const r = count / max
  return r <= 0.25 ? 1 : r <= 0.5 ? 2 : r <= 0.75 ? 3 : 4
}

/**
 * GitHub-style study calendar: one column per week (Mon–Sun), one hue stepping light→dark with activity.
 * Fills the available width, up to 53 weeks.
 */
export function ActivityHeatmap({ days }: { days: Day[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [focus, setFocus] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const weeksFit = width ? Math.max(8, Math.min(53, Math.floor((width - LABEL_W + GAP) / (CELL + GAP)))) : 0

  const { cells, weeks, max, months } = useMemo(() => {
    if (!days.length || !weeksFit) return { cells: [] as (Day | null)[], weeks: 0, max: 0, months: [] as { col: number; label: string }[] }
    const last = keyToLocalDate(days[days.length - 1].date)
    const lastDow = (last.getDay() + 6) % 7 // Monday = 0
    const total = (weeksFit - 1) * 7 + lastDow + 1
    const slice = days.slice(-total)
    const pad = weeksFit * 7 - slice.length - (6 - lastDow)
    const grid: (Day | null)[] = [...Array(Math.max(0, pad)).fill(null), ...slice]
    const monthMarks: { col: number; label: string }[] = []
    let prevMonth = -1
    for (let col = 0; col < weeksFit; col++) {
      const first = grid.slice(col * 7, col * 7 + 7).find(Boolean)
      if (!first) continue
      const m = keyToLocalDate(first.date).getMonth()
      if (m === prevMonth) continue
      prevMonth = m
      // A partial first month would collide with the next label — keep labels ≥3 columns apart.
      const last = monthMarks[monthMarks.length - 1]
      if (last && col - last.col < 3) monthMarks.pop()
      monthMarks.push({ col, label: format(keyToLocalDate(first.date), "MMM") })
    }
    return { cells: grid, weeks: weeksFit, max: Math.max(...slice.map((d) => d.count), 0), months: monthMarks }
  }, [days, weeksFit])

  const shown = cells.filter(Boolean) as Day[]
  const totalActivity = shown.reduce((n, d) => n + d.count, 0)
  const activeDays = shown.filter((d) => d.count > 0).length
  const tip = focus ?? hover
  const tipDay = tip !== null ? cells[tip] : null

  const move = (e: KeyboardEvent) => {
    const deltas: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 }
    if (!(e.key in deltas)) return
    e.preventDefault()
    const start = focus ?? cells.length - 1
    let next = start + deltas[e.key]
    while (next >= 0 && next < cells.length && !cells[next]) next += deltas[e.key] > 0 ? 1 : -1
    if (next >= 0 && next < cells.length) setFocus(next)
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      {weeks > 0 && (
        <>
          <div className="relative mb-1.5 h-4 text-[11px] text-fg-3" style={{ marginLeft: LABEL_W }}>
            {months.map((m) => (
              <span key={`${m.col}-${m.label}`} className="absolute" style={{ left: m.col * (CELL + GAP) }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex">
            <div className="grid shrink-0 text-[10.5px] text-fg-3" style={{ width: LABEL_W, gridTemplateRows: `repeat(7, ${CELL}px)`, rowGap: GAP }}>
              {["Mon", "", "Wed", "", "Fri", "", ""].map((d, i) => (
                <span key={i} className="leading-[13px]">
                  {d}
                </span>
              ))}
            </div>
            <div
              role="grid"
              tabIndex={0}
              aria-label={`Study activity: ${totalActivity} activities over ${activeDays} active days. Use arrow keys to inspect days.`}
              onKeyDown={move}
              onFocus={() => setFocus((f) => f ?? cells.length - 1)}
              onBlur={() => setFocus(null)}
              className="grid grid-flow-col rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--surface)]"
              style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gridAutoColumns: `${CELL}px`, gap: GAP }}
            >
              {cells.map((d, i) =>
                d ? (
                  <div
                    key={d.date}
                    role="gridcell"
                    aria-label={`${d.count} on ${format(keyToLocalDate(d.date), "EEE, MMM d, yyyy")}`}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                    className={cn(
                      "heat-cell rounded-[3px] transition-[transform,box-shadow] duration-150",
                      tip === i && "scale-125 shadow-[0_0_0_2px_var(--surface),0_0_0_3.5px_var(--chart-accent)]",
                    )}
                    style={{ background: LEVEL_VARS[levelOf(d.count, max)], animationDelay: `${Math.floor(i / 7) * 14}ms` }}
                  />
                ) : (
                  <div key={`pad-${i}`} aria-hidden />
                ),
              )}
            </div>
          </div>
          {tipDay && tip !== null && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-pop"
              style={{
                left: LABEL_W + Math.floor(tip / 7) * (CELL + GAP) + CELL / 2,
                top: 20 + (tip % 7) * (CELL + GAP) - 6,
              }}
            >
              <span className="font-semibold text-fg">
                {tipDay.count} {tipDay.count === 1 ? "activity" : "activities"}
              </span>
              <span className="text-fg-3"> · {format(keyToLocalDate(tipDay.date), "EEE, MMM d")}</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-3">
            <span>
              <span className="font-semibold text-fg-2">{totalActivity.toLocaleString()}</span> activities on{" "}
              <span className="font-semibold text-fg-2">{activeDays}</span> days
            </span>
            <span className="flex items-center gap-1.5">
              Less
              {LEVEL_VARS.map((c) => (
                <span key={c} className="size-[11px] rounded-[3px]" style={{ background: c }} />
              ))}
              More
            </span>
          </div>
        </>
      )}
    </div>
  )
}
