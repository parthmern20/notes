"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { motion } from "motion/react"
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Clock,
  Flame,
  Layers,
  PartyPopper,
  Plus,
  Repeat,
  SquareTerminal,
  Target,
  Trophy,
  Zap,
} from "lucide-react"
import { useNotes, useQueue, useSkills, useStats } from "@/lib/client/api"
import { useStoredState } from "@/lib/client/hooks"
import type { StatsDTO } from "@/lib/types"
import { cn, formatMinutes, formatNumber, greeting, plural } from "@/lib/utils"
import { ActivityHeatmap } from "@/components/charts/activity-heatmap"
import { bucketize, ChartCard, StatTile } from "@/components/charts/chart-card"
import { MasteryBar, ProgressRing, SkillMeters } from "@/components/charts/mastery-charts"
import { ForecastChart, TrendChart } from "@/components/charts/trend-charts"
import { AnimatedNumber, Stagger, StaggerItem } from "@/components/motion/motion"
import { NoteCard } from "@/components/notes/note-card"
import { useAppUI } from "@/components/shell/app-ui"
import { MASTERY_COLOR } from "@/components/skills/skill-visuals"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardHeader, EmptyState, Skeleton } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"
import { ErrorState } from "@/components/ui/states"

type Range = 7 | 30 | 90
type Metric = "reviews" | "minutes" | "notes" | "recall"

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <div className="absolute -left-24 -top-24 size-80 animate-float rounded-full bg-[radial-gradient(circle,rgb(124_108_255/0.45),transparent_65%)] blur-2xl" />
      <div className="absolute -right-16 top-0 size-72 animate-float rounded-full bg-[radial-gradient(circle,rgb(34_190_240/0.32),transparent_65%)] blur-2xl [animation-delay:-2.5s]" />
      <div className="absolute -bottom-32 left-1/3 size-80 animate-float rounded-full bg-[radial-gradient(circle,rgb(217_70_239/0.22),transparent_65%)] blur-2xl [animation-delay:-5s]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
    </div>
  )
}

function Hero({ stats }: { stats: StatsDTO }) {
  const dueTotal = stats.due.notes + stats.due.cards
  const doneToday = stats.due.reviewedToday + stats.due.cardsReviewedToday
  const goal = doneToday + dueTotal
  const caughtUp = dueTotal === 0
  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <Aurora />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-3">
            <CalendarDays className="size-4" />
            {format(new Date(), "EEEE, MMMM d")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}
            <span className="text-gradient"> — let&apos;s make it stick.</span>
          </h1>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-[56px] font-semibold leading-none tracking-tighter sm:text-[64px]">
              <AnimatedNumber value={dueTotal} />
            </div>
            <div className="pb-1.5 text-sm leading-snug text-fg-2">
              {caughtUp ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-success-ink">
                  <PartyPopper className="size-4" /> All caught up — nothing due.
                </span>
              ) : (
                <>
                  items due for revision
                  <br />
                  <span className="text-fg-3">
                    {plural(stats.due.notes, "note")} · {plural(stats.due.cards, "flashcard")}
                    {stats.due.newNotes > 0 && ` · ${stats.due.newNotes} new`}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/revise/session" className={buttonVariants({ variant: "primary", size: "lg", className: "group" })}>
              <Repeat /> {caughtUp ? "Practice anyway" : "Start revision"}
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/revise/flashcards" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              <Zap /> Flashcards
              {stats.due.cards > 0 && <span className="rounded-full bg-primary-soft px-1.5 text-xs text-primary-ink">{stats.due.cards}</span>}
            </Link>
            <Link href="/notes/new" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              <Plus /> New note
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center gap-2">
            <ProgressRing value={doneToday} max={Math.max(goal, 1)}>
              <div>
                <div className="text-2xl font-semibold leading-none tabular-nums">
                  {doneToday}
                  <span className="text-base text-fg-3">/{goal}</span>
                </div>
                <div className="mt-1 text-[11px] text-fg-3">reviewed today</div>
              </div>
            </ProgressRing>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-[color-mix(in_oklab,var(--surface)_80%,transparent)] px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <Flame className={cn("size-6", stats.streak.current > 0 ? "animate-flicker text-[#f97316]" : "text-fg-3")} />
                <span className="text-2xl font-semibold tabular-nums">{stats.streak.current}</span>
                <span className="text-sm text-fg-3">day streak</span>
              </div>
              <div className="mt-1 text-xs text-fg-3">
                {stats.streak.activeToday ? "Studied today ✓" : stats.streak.current > 0 ? "Study today to keep it" : "Start one today"}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-[color-mix(in_oklab,var(--surface)_80%,transparent)] px-4 py-3 text-sm backdrop-blur">
              <Trophy className="size-4 text-[#e8a20b]" />
              <span className="text-fg-3">Best</span>
              <span className="font-semibold tabular-nums">{plural(stats.streak.longest, "day")}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Onboarding() {
  const { openSkillDialog } = useAppUI()
  const steps = [
    { icon: <Layers />, title: "Create a skill", text: "One per technology or subject — AWS, Docker, Python, System Design…" },
    { icon: <SquareTerminal />, title: "Write rich notes", text: "Headings, highlights, code snippets, terminal commands, callouts and tables." },
    { icon: <Brain />, title: "Revise smartly", text: "Spaced repetition schedules each note and flashcard right before you'd forget it." },
  ]
  return (
    <Card className="relative overflow-hidden p-8 sm:p-12">
      <Aurora />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }} className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-[linear-gradient(140deg,#8b7cff,#5b4cf0_55%,#1fb6f2)] text-white shadow-glow">
          <Brain className="size-8" />
        </motion.div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome to your <span className="text-gradient">second brain</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-fg-3">
          Save what you learn, organised by skill — then revise it at exactly the right time so it sticks.
        </p>
        <Stagger className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.title} className="rounded-2xl border border-border bg-[color-mix(in_oklab,var(--surface)_85%,transparent)] p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-[18px]">{s.icon}</span>
                <span className="text-xs font-semibold text-fg-3">STEP {i + 1}</span>
              </div>
              <div className="font-semibold">{s.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-fg-3">{s.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => openSkillDialog()} className={buttonVariants({ variant: "primary", size: "lg" })}>
            <Plus /> Create your first skill
          </button>
          <Link href="/notes/new" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            <BookOpen /> Write a note
          </Link>
        </div>
      </div>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}

const METRICS: { key: Metric; label: string; icon: React.ReactNode }[] = [
  { key: "reviews", label: "Reviews", icon: <Repeat /> },
  { key: "minutes", label: "Study time", icon: <Clock /> },
  { key: "notes", label: "Notes added", icon: <BookOpen /> },
  { key: "recall", label: "Recall rate", icon: <Target /> },
]

export function DashboardView() {
  const [range, setRange] = useStoredState<Range>("mnemo:dashboard-range", 30)
  const [metric, setMetric] = useState<Metric>("reviews")
  const { data: stats, error, isValidating, mutate } = useStats(range)
  const { data: skills } = useSkills()
  const { data: due = [] } = useQueue({ mode: "due", limit: 5 })
  const { data: recent = [] } = useNotes({ sort: "updated", limit: 5 })
  const skillMap = useMemo(() => new Map(skills?.map((s) => [s.id, s])), [skills])

  const series = useMemo(() => {
    if (!stats) return null
    const d = stats.range.days
    return {
      reviews: stats.daily.map((p) => ({ date: p.date, value: p.reviews + p.cards })),
      minutes: stats.daily.map((p) => ({ date: p.date, value: p.minutes })),
      notes: stats.daily.map((p) => ({ date: p.date, value: p.notes })),
      recall: stats.daily.map((p) => {
        const attempts = p.reviews + p.cards
        return { date: p.date, value: attempts ? Math.round((p.recalled / attempts) * 100) : null }
      }),
      period: `prior ${d}d`,
    }
  }, [stats])

  if (error && !stats) return <ErrorState error={error} onRetry={() => mutate()} title="Couldn't load your dashboard" />
  if (!stats || !series) return <DashboardSkeleton />
  if (stats.totals.notes === 0 && stats.totals.skills === 0) return <Onboarding />

  const { current, previous } = stats.range
  const avgMastery = stats.mastery.average
  const trend = {
    reviews: { data: series.reviews, label: "reviews", format: formatNumber, title: "Reviews per day" },
    minutes: { data: series.minutes, label: "minutes", format: (n: number) => formatMinutes(n), title: "Study time per day" },
    notes: { data: series.notes, label: "notes added", format: formatNumber, title: "Notes added per day" },
    recall: { data: series.recall, label: "recalled", format: (n: number) => `${Math.round(n)}%`, title: "Recall rate per day (rated Good or Easy)" },
  }[metric]

  return (
    <Stagger className="grid gap-6">
      <StaggerItem>
        <Hero stats={stats} />
      </StaggerItem>

      <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Notes" value={stats.totals.notes} icon={<BookOpen />} hint={`${plural(stats.totals.skills, "skill")} · ${stats.totals.notesThisWeek} new this week`} />
        <StatTile label="Flashcards" value={stats.totals.flashcards} icon={<Zap />} hint={`${stats.due.cards} due now`} />
        <StatTile label="Commands saved" value={stats.totals.commands} icon={<SquareTerminal />} hint={`${plural(stats.totals.codeBlocks, "code snippet")}`} />
        <StatTile label="Average mastery" value={avgMastery} format={(n) => `${Math.round(n)}`} suffix="%" icon={<Brain />} hint={`${stats.mastery.counts.mastered} of ${stats.totals.notes} notes mastered`} />
      </StaggerItem>

      <StaggerItem className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Study activity"
          description="Reviews, flashcards and new notes per day"
          icon={<CalendarDays />}
          table={{
            columns: ["Day", "Activities"],
            rows: stats.heatmap
              .filter((d) => d.count > 0)
              .reverse()
              .map((d) => [d.date, d.count]),
          }}
        >
          <ActivityHeatmap days={stats.heatmap} />
        </ChartCard>
        <ChartCard
          title="Mastery"
          description="How well your notes are retained"
          icon={<Brain />}
          table={{
            columns: ["Level", "Notes"],
            rows: (["new", "learning", "familiar", "mastered"] as const).map((l) => [l[0].toUpperCase() + l.slice(1), stats.mastery.counts[l]]),
          }}
        >
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="flex items-end gap-3">
              <div className="text-4xl font-semibold tracking-tight">
                <AnimatedNumber value={avgMastery} />%
              </div>
              <div className="pb-1 text-sm text-fg-3">average retention score</div>
            </div>
            <MasteryBar counts={stats.mastery.counts} />
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(["learning", "mastered"] as const).map((l) => (
                <div key={l} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <span className="size-2 rounded-full" style={{ background: MASTERY_COLOR[l] }} />
                  <span className="text-fg-3">{l === "learning" ? "In progress" : "Mastered"}</span>
                  <span className="ml-auto font-semibold tabular-nums">{l === "learning" ? stats.mastery.counts.learning + stats.mastery.counts.familiar : stats.mastery.counts.mastered}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </StaggerItem>

      <StaggerItem className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Skill progress"
          description="Mastery score per skill"
          icon={<Layers />}
          table={{ columns: ["Skill", "Notes", "Due", "Mastery %"], rows: stats.skills.map((s) => [s.name, s.notes, s.due, s.mastery]) }}
        >
          {stats.skills.length ? (
            <SkillMeters skills={stats.skills} />
          ) : (
            <EmptyState className="py-8" icon={<Layers />} title="No skills yet" description="Create a skill to start tracking progress." />
          )}
        </ChartCard>
        <ChartCard
          title="Upcoming reviews"
          description="Notes and flashcards due over the next 14 days"
          icon={<CalendarDays />}
          table={{ columns: ["Day", "Notes", "Flashcards"], rows: stats.forecast.map((f) => [f.date, f.notes, f.cards]) }}
        >
          <ForecastChart data={stats.forecast} />
        </ChartCard>
      </StaggerItem>

      <StaggerItem className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<Repeat />}
            title="Due for revision"
            description="Most overdue first"
            action={
              <Link href="/revise" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Revise hub <ArrowRight />
              </Link>
            }
          />
          <div className="grid gap-1 p-3">
            {due.length ? (
              due.map((n) => <NoteCard key={n.id} note={n} layout="compact" skill={skillMap.get(n.skillId)} />)
            ) : (
              <EmptyState className="py-8" icon={<PartyPopper />} title="Nothing due" description="Every note is scheduled for later. Great work!" />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            icon={<BookOpen />}
            title="Recently edited"
            description="Pick up where you left off"
            action={
              <Link href="/notes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                All notes <ArrowRight />
              </Link>
            }
          />
          <div className="grid gap-1 p-3">
            {recent.length ? (
              recent.map((n) => <NoteCard key={n.id} note={n} layout="compact" skill={skillMap.get(n.skillId)} />)
            ) : (
              <EmptyState className="py-8" icon={<BookOpen />} title="No notes yet" description="Your latest notes will appear here." />
            )}
          </div>
        </Card>
      </StaggerItem>

      <StaggerItem className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Insights</h2>
            <p className="text-sm text-fg-3">Everything below covers the selected period.</p>
          </div>
          <Segmented
            ariaLabel="Period"
            value={String(range) as "7" | "30" | "90"}
            onChange={(v) => setRange(Number(v) as Range)}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        </div>
        <div role="tablist" aria-label="Metric" className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4 transition-opacity", isValidating && "opacity-60")}>
          {METRICS.map((m) => {
            const props =
              m.key === "reviews"
                ? { value: current.reviews + current.cards, delta: { current: current.reviews + current.cards, previous: previous.reviews + previous.cards, period: series.period }, spark: bucketize(series.reviews.map((p) => p.value)) }
                : m.key === "minutes"
                  ? { value: current.minutes, format: formatMinutes, delta: { current: current.minutes, previous: previous.minutes, period: series.period }, spark: bucketize(series.minutes.map((p) => p.value)) }
                  : m.key === "notes"
                    ? { value: current.notes, delta: { current: current.notes, previous: previous.notes, period: series.period }, spark: bucketize(series.notes.map((p) => p.value)) }
                    : {
                        value: current.recallRate ?? 0,
                        format: (n: number) => (current.recallRate === null ? "—" : `${Math.round(n)}%`),
                        delta:
                          current.recallRate !== null && previous.recallRate !== null
                            ? { current: current.recallRate, previous: previous.recallRate, unit: "points" as const, period: series.period }
                            : undefined,
                        hint: current.recallRate === null ? "Rate reviews to see this" : undefined,
                      }
            return <StatTile key={m.key} label={m.label} icon={m.icon} selected={metric === m.key} onSelect={() => setMetric(m.key)} {...props} />
          })}
        </div>
        <ChartCard
          title={trend.title}
          description={`Last ${range} days`}
          dim={isValidating}
          table={{ columns: ["Day", trend.label], rows: trend.data.map((p) => [p.date, p.value === null ? "—" : trend.format(p.value)]) }}
        >
          <TrendChart
            data={trend.data}
            label={trend.label}
            formatValue={trend.format}
            height={260}
            domain={metric === "recall" ? [0, 100] : undefined}
          />
        </ChartCard>
      </StaggerItem>
    </Stagger>
  )
}
