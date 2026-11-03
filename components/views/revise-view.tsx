"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Brain, Flame, Repeat, Sparkles, Star, Target, Zap } from "lucide-react"
import { useSkills, useStats } from "@/lib/client/api"
import { formatInterval, previewIntervals, RATING_META, RATINGS } from "@/lib/srs"
import type { ReviewMode } from "@/lib/types"
import { cn, plural } from "@/lib/utils"
import { Meter } from "@/components/charts/mastery-charts"
import { AnimatedNumber, spotlightHandlers, Stagger, StaggerItem } from "@/components/motion/motion"
import { SkillIcon } from "@/components/skills/skill-visuals"
import { buttonVariants } from "@/components/ui/button"
import { Select } from "@/components/ui/overlays"
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"

const MODE_INFO: Record<ReviewMode, { label: string; icon: React.ReactNode; text: string }> = {
  due: { label: "Due", icon: <Repeat />, text: "Notes scheduled for today, most overdue first. The everyday habit." },
  all: { label: "Everything", icon: <Sparkles />, text: "Every note in scope — great before an exam or interview." },
  weak: { label: "Weak spots", icon: <Target />, text: "Notes you forgot or found hard recently, weakest first." },
  important: { label: "Important", icon: <Star />, text: "Only notes you starred as important." },
}

function BigAction({
  href,
  icon,
  title,
  count,
  unit,
  text,
  accent,
}: {
  href: string
  icon: React.ReactNode
  title: string
  count: number
  unit: string
  text: string
  accent: string
}) {
  return (
    <Link
      href={href}
      {...spotlightHandlers()}
      className="spotlight group relative flex min-h-52 flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-pop"
    >
      <div aria-hidden className={cn("absolute -right-16 -top-16 size-56 rounded-full opacity-60 blur-3xl transition-opacity group-hover:opacity-90", accent)} />
      <div className="relative flex items-center justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-ink [&_svg]:size-6">{icon}</span>
        <ArrowRight className="size-5 text-fg-3 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary-ink" />
      </div>
      <div className="relative mt-auto pt-8">
        <div className="text-sm font-medium text-fg-3">{title}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight">
            <AnimatedNumber value={count} />
          </span>
          <span className="text-fg-3">{unit}</span>
        </div>
        <p className="mt-2 text-sm text-fg-3">{text}</p>
      </div>
    </Link>
  )
}

export function ReviseView() {
  const { data: stats } = useStats(30)
  const { data: skills } = useSkills()
  const [scope, setScope] = useState("all")
  const [mode, setMode] = useState<ReviewMode>("due")

  const skillParam = scope === "all" ? "" : `skill=${scope}&`
  const example = previewIntervals({ ease: 2.5, interval: 5, repetitions: 2, reviewCount: 2, lapses: 0 })

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Revise"
        description="Spaced repetition brings each note back right before you'd forget it."
        actions={
          stats && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
              <Flame className={cn("size-4", stats.streak.current ? "animate-flicker text-[#f97316]" : "text-fg-3")} />
              <span className="font-semibold">{plural(stats.streak.current, "day")}</span>
              <span className="text-fg-3">streak</span>
            </span>
          )
        }
      />

      {!stats ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
      ) : (
        <Stagger className="grid gap-5 md:grid-cols-2">
          <StaggerItem>
            <BigAction
              href="/revise/session"
              icon={<Repeat />}
              title="Note review"
              count={stats.due.notes}
              unit={stats.due.notes === 1 ? "note due" : "notes due"}
              text={stats.due.newNotes ? `Includes ${stats.due.newNotes} new ${stats.due.newNotes === 1 ? "note" : "notes"} never revised.` : "Recall first, then read and rate each note."}
              accent="bg-[radial-gradient(circle,rgb(124_108_255/0.55),transparent_70%)]"
            />
          </StaggerItem>
          <StaggerItem>
            <BigAction
              href="/revise/flashcards"
              icon={<Zap />}
              title="Flashcards"
              count={stats.due.cards}
              unit={stats.due.cards === 1 ? "card due" : "cards due"}
              text="Flip, answer from memory, rate. Fast and effective."
              accent="bg-[radial-gradient(circle,rgb(34_190_240/0.5),transparent_70%)]"
            />
          </StaggerItem>
        </Stagger>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader icon={<Brain />} title="Custom session" description="Choose what to practise." />
          <div className="grid gap-5 p-5">
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-fg-2">Scope</span>
              <Select
                ariaLabel="Scope"
                value={scope}
                onValueChange={setScope}
                options={[
                  { value: "all", label: "All skills" },
                  ...(skills ?? []).map((s) => ({
                    value: s.id,
                    label: s.name,
                    icon: <SkillIcon icon={s.icon} color={s.color} size="xs" className="size-5" />,
                    hint: s.stats.due ? `${s.stats.due} due` : undefined,
                  })),
                ]}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-[13px] font-medium text-fg-2">Mode</span>
              <Segmented
                value={mode}
                onChange={setMode}
                ariaLabel="Mode"
                className="flex w-full flex-wrap [&>button]:flex-1 [&>button]:justify-center"
                options={(Object.keys(MODE_INFO) as ReviewMode[]).map((m) => ({ value: m, label: MODE_INFO[m].label, icon: MODE_INFO[m].icon }))}
              />
              <motion.p key={mode} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-fg-3">
                {MODE_INFO[mode].text}
              </motion.p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/revise/session?${skillParam}mode=${mode}`} className={buttonVariants({ variant: "primary" })}>
                <Repeat /> Review notes
              </Link>
              {(mode === "due" || mode === "all") && (
                <Link href={`/revise/flashcards?${skillParam}mode=${mode}`} className={buttonVariants({ variant: "secondary" })}>
                  <Zap /> Study flashcards
                </Link>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Target />} title="How rating works" description="Be honest — the schedule adapts to you." />
          <div className="grid gap-2 p-5">
            {RATINGS.map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                <span className="w-14 font-semibold">{RATING_META[r].label}</span>
                <span className="flex-1 text-fg-3">{RATING_META[r].hint}</span>
                <span className="text-xs text-fg-3">e.g. {formatInterval(example[r])}</span>
              </div>
            ))}
            <p className="mt-2 text-xs leading-relaxed text-fg-3">
              Intervals grow each time you remember (2d → 5d → 2w → 1mo…) and reset when you forget. Notes reach <b className="text-fg-2">Mastered</b> at 3+ weeks.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader icon={<Repeat />} title="By skill" description="Due work and mastery for each skill" />
        <div className="p-3">
          {!skills ? (
            <Skeleton className="m-2 h-40 rounded-xl" />
          ) : skills.length === 0 ? (
            <EmptyState className="py-10" icon={<Brain />} title="No skills yet" description="Create a skill and add notes to start revising." />
          ) : (
            <div className="divide-y divide-border">
              {skills.map((s) => (
                <div key={s.id} className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                  <Link href={`/skills/${s.id}`} className="flex min-w-0 items-center gap-3">
                    <SkillIcon icon={s.icon} color={s.color} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="text-xs text-fg-3">
                        {plural(s.stats.due, "note")} due · {plural(s.stats.cardsDue, "card")} due
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <Meter value={s.stats.mastery} label={`${s.name} mastery`} />
                    <span className="w-10 text-right text-sm font-semibold tabular-nums">{s.stats.mastery}%</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href={`/revise/session?skill=${s.id}${s.stats.due ? "" : "&mode=all"}`} className={buttonVariants({ variant: s.stats.due ? "primary" : "secondary", size: "sm" })}>
                      <Repeat /> {s.stats.due ? "Review" : "Practise"}
                    </Link>
                    {s.stats.flashcards > 0 && (
                      <Link href={`/revise/flashcards?skill=${s.id}${s.stats.cardsDue ? "" : "&mode=all"}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                        <Zap /> Cards
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
