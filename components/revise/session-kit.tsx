"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Clock, PartyPopper, RotateCcw, Target, Trophy, X } from "lucide-react"
import { RATING_META, RATINGS } from "@/lib/srs"
import type { Rating } from "@/lib/types"
import { cn, formatMinutes } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/primitives"

export interface SessionResult {
  id: string
  title: string
  rating: Rating
  ms: number
  href?: string
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((now - since) / 1000))
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Clock className="size-3.5" />
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
    </span>
  )
}

export function SessionHeader({
  title,
  subtitle,
  done,
  total,
  startedAt,
  onExit,
  right,
}: {
  title: ReactNode
  subtitle?: ReactNode
  done: number
  total: number
  startedAt: number
  onExit: () => void
  right?: ReactNode
}) {
  const pct = total ? (done / total) * 100 : 0
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onExit}
          aria-label="Leave session"
          className="grid size-9 place-items-center rounded-[10px] text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          {subtitle && <div className="truncate text-xs text-fg-3">{subtitle}</div>}
        </div>
        <div className="hidden items-center gap-4 text-xs text-fg-3 sm:flex">
          <Elapsed since={startedAt} />
          <span className="tabular-nums">
            <span className="font-semibold text-fg">{Math.min(done + 1, total)}</span> / {total}
          </span>
        </div>
        {right}
      </div>
      <div className="h-[3px] w-full bg-surface-3">
        <motion.div
          className="h-full bg-[linear-gradient(90deg,var(--primary),var(--accent-2))]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
    </header>
  )
}

const RATING_TONE: Record<Rating, string> = {
  1: "text-danger-ink bg-[color-mix(in_oklab,var(--danger)_10%,var(--surface))] border-[color-mix(in_oklab,var(--danger)_30%,var(--border))]",
  2: "text-warning-ink bg-[color-mix(in_oklab,var(--warning)_12%,var(--surface))] border-[color-mix(in_oklab,var(--warning)_30%,var(--border))]",
  3: "text-success-ink bg-[color-mix(in_oklab,var(--success)_10%,var(--surface))] border-[color-mix(in_oklab,var(--success)_30%,var(--border))]",
  4: "text-info-ink bg-[color-mix(in_oklab,var(--info)_10%,var(--surface))] border-[color-mix(in_oklab,var(--info)_30%,var(--border))]",
}

export function SessionSummary({
  results,
  startedAt,
  kind,
  actions,
}: {
  results: SessionResult[]
  startedAt: number
  kind: "notes" | "cards"
  actions: ReactNode
}) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce || !results.length) return
    let cancelled = false
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return
      const colors = ["#7c6cff", "#5b4cf0", "#22b8f0", "#f5b53d", "#2fbf71"]
      confetti({ particleCount: 110, spread: 75, startVelocity: 42, origin: { y: 0.65 }, colors })
      setTimeout(() => !cancelled && confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 220)
      setTimeout(() => !cancelled && confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 380)
    })
    return () => {
      cancelled = true
    }
  }, [reduce, results.length])

  const counts = RATINGS.map((r) => results.filter((x) => x.rating === r).length)
  const recalled = counts[2] + counts[3]
  const recallRate = results.length ? Math.round((recalled / results.length) * 100) : 0
  const minutes = (Date.now() - startedAt) / 60_000
  const retry = results.filter((r) => r.rating <= 2)

  return (
    <div className="mx-auto grid max-w-2xl gap-6 py-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="mx-auto mb-5 grid size-20 place-items-center rounded-3xl bg-[linear-gradient(140deg,#fbbf24,#f97316)] text-white shadow-[0_18px_40px_-14px_#f97316]"
        >
          <Trophy className="size-10" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-3xl font-semibold tracking-tight">
          Session complete!
        </motion.h1>
        <p className="mt-2 text-fg-3">
          You reviewed {results.length} {kind === "notes" ? (results.length === 1 ? "note" : "notes") : results.length === 1 ? "flashcard" : "flashcards"}. Each one is now scheduled for the right moment.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <PartyPopper />, value: String(results.length), label: "reviewed" },
          { icon: <Clock />, value: formatMinutes(minutes), label: "time spent" },
          { icon: <Target />, value: `${recallRate}%`, label: "recalled well" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }}>
            <Card className="p-4 text-center">
              <div className="mx-auto mb-2 grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-4">{s.icon}</div>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-fg-3">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-5">
        <div className="mb-3 text-sm font-semibold">How it went</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((r, i) => (
            <div key={r} className={cn("rounded-xl border px-3 py-2.5", RATING_TONE[r])}>
              <div className="text-xl font-semibold tabular-nums">{counts[i]}</div>
              <div className="text-xs font-medium">{RATING_META[r].label}</div>
            </div>
          ))}
        </div>
        {retry.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-3">
              <RotateCcw className="size-3.5" /> Needs another look
            </div>
            <ul className="grid gap-1">
              {retry.slice(0, 8).map((r, i) => (
                <li key={`${r.id}-${i}`}>
                  {r.href ? (
                    <Link href={r.href} className="block truncate rounded-lg px-2 py-1.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg">
                      {r.title}
                    </Link>
                  ) : (
                    <span className="block truncate px-2 py-1.5 text-sm text-fg-2">{r.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  )
}

export function EmptySession({ kind, skillId }: { kind: "notes" | "cards"; skillId?: string }) {
  const base = kind === "notes" ? "/revise/session" : "/revise/flashcards"
  const skill = skillId ? `skill=${skillId}&` : ""
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="mx-auto mb-6 grid size-20 place-items-center rounded-3xl bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success-ink"
      >
        <PartyPopper className="size-10" />
      </motion.div>
      <h1 className="text-2xl font-semibold tracking-tight">All caught up!</h1>
      <p className="mt-2 text-fg-3">
        Nothing is due right now — spaced repetition has scheduled everything for later. You can still practise ahead:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href={`${base}?${skill}mode=all`} className={buttonVariants({ variant: "primary" })}>
          Review everything
        </Link>
        {kind === "notes" && (
          <>
            <Link href={`${base}?${skill}mode=weak`} className={buttonVariants({ variant: "secondary" })}>
              Weak spots
            </Link>
            <Link href={`${base}?${skill}mode=important`} className={buttonVariants({ variant: "secondary" })}>
              Important notes
            </Link>
          </>
        )}
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          Dashboard
        </Link>
      </div>
    </div>
  )
}
