"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { MASTERY_LEVELS, MASTERY_META } from "@/lib/srs"
import type { MasteryLevel, SkillProgressDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MASTERY_COLOR, SkillIcon } from "@/components/skills/skill-visuals"

const INK: Record<MasteryLevel, string> = {
  new: "var(--mastery-new-ink)",
  learning: "var(--mastery-learning-ink)",
  familiar: "var(--mastery-familiar-ink)",
  mastered: "var(--mastery-mastered-ink)",
}

/** One whole (all notes) split by mastery level: tall segmented bar, shares printed where they fit. */
export function MasteryBar({ counts }: { counts: Record<MasteryLevel, number> }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<MasteryLevel | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const total = MASTERY_LEVELS.reduce((n, l) => n + counts[l], 0)
  const parts = MASTERY_LEVELS.filter((l) => counts[l] > 0)
  const usable = width - Math.max(0, parts.length - 1) * 2

  return (
    <div>
      <div ref={ref} className="relative flex h-7 w-full gap-[2px]" role="list" aria-label="Notes by mastery level">
        {total === 0 && <div className="h-full w-full rounded bg-surface-2" />}
        {parts.map((level, i) => {
          const share = counts[level] / total
          const pct = Math.round(share * 100)
          const label = `${pct}%`
          const fits = share * usable >= label.length * 7.5 + 14
          return (
            <motion.div
              key={level}
              role="listitem"
              tabIndex={0}
              aria-label={`${MASTERY_META[level].label}: ${counts[level]} notes, ${pct}%`}
              initial={{ flexGrow: 0.0001 }}
              animate={{ flexGrow: share }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: i * 0.06 }}
              onMouseEnter={() => setActive(level)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(level)}
              onBlur={() => setActive(null)}
              className={cn(
                "relative flex basis-0 items-center overflow-visible rounded px-2 text-xs font-semibold outline-none transition-[filter] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                active && active !== level && "brightness-[0.92] saturate-[0.8]",
              )}
              style={{ background: MASTERY_COLOR[level], color: INK[level] }}
            >
              {fits && <span className="tabular-nums">{label}</span>}
              {active === level && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-normal text-fg shadow-pop">
                  <span className="font-semibold">{counts[level]}</span> <span className="text-fg-3">{MASTERY_META[level].label.toLowerCase()} · {pct}%</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-2">
        {MASTERY_LEVELS.map((level) => (
          <span key={level} className="inline-flex items-center gap-1.5" title={MASTERY_META[level].description}>
            <span className="size-2.5 rounded-[3px]" style={{ background: MASTERY_COLOR[level] }} />
            {MASTERY_META[level].label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A ratio against a limit: fill in the accent, track a lighter step of the same ramp. */
export function Meter({ value, className, label }: { value: number; className?: string; label?: string }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--meter-track)]", className)}
    >
      <motion.div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--chart-accent),color-mix(in_oklab,var(--chart-accent)_70%,var(--accent-2)))]"
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(value, value > 0 ? 2 : 0)}%` }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
      />
    </div>
  )
}

export function SkillMeters({ skills }: { skills: SkillProgressDTO[] }) {
  return (
    <ul className="grid gap-4">
      {skills.map((s) => (
        <li key={s.id}>
          <Link href={`/skills/${s.id}`} className="group grid gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <div className="flex items-center gap-3">
              <SkillIcon icon={s.icon} color={s.color} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium transition-colors group-hover:text-primary-ink">{s.name}</div>
                <div className="text-xs text-fg-3">
                  {s.notes} {s.notes === 1 ? "note" : "notes"} · {s.mastered} mastered{s.due ? ` · ${s.due} due` : ""}
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums">{s.mastery}%</span>
            </div>
            <Meter value={s.mastery} label={`${s.name} mastery`} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Circular meter for a single ratio (e.g. today's reviews vs what was due). */
export function ProgressRing({
  value,
  max,
  size = 132,
  stroke = 11,
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--meter-track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - ratio) }}
          transition={{ type: "spring", stiffness: 50, damping: 16, delay: 0.2 }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--chart-accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
