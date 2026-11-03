"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNowStrict } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Clock,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Repeat,
  Star,
  Trash,
  Zap,
} from "lucide-react"
import { api, errorMessage, revalidateNotesData, useNote, useSkills } from "@/lib/client/api"
import { useHotkeys, useStoredState } from "@/lib/client/hooks"
import { docToMarkdown, extractHeadings } from "@/lib/doc"
import { formatInterval, MASTERY_META } from "@/lib/srs"
import type { NoteDTO, Rating, ReviewResult } from "@/lib/types"
import { cn, downloadFile, safeFilename } from "@/lib/utils"
import { NoteRenderer } from "@/components/reader/note-renderer"
import { Flashcard, RatingBar, ReadingProgress, TableOfContents } from "@/components/reader/revision-kit"
import { Takeaways, takeawayLines } from "@/components/reader/takeaways"
import { MasteryBadge, SkillChip } from "@/components/skills/skill-visuals"
import { Button, buttonVariants } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Switch, Tooltip } from "@/components/ui/overlays"
import { Card, Skeleton } from "@/components/ui/primitives"
import { ErrorState } from "@/components/ui/states"
import { copyText } from "@/components/ui/copy-button"

function noteToMarkdown(note: NoteDTO, skillName?: string): string {
  const parts = [`# ${note.title}`, ""]
  const meta = [skillName && `Skill: ${skillName}`, note.tags.length && `Tags: ${note.tags.map((t) => `#${t}`).join(" ")}`, note.source && `Source: ${note.source}`].filter(Boolean)
  if (meta.length) parts.push(meta.join("  \n"), "")
  const takeaways = takeawayLines(note.summary)
  if (takeaways.length) parts.push("## Key takeaways", "", ...takeaways.map((t) => `- ${t}`), "")
  parts.push(docToMarkdown(note.content))
  if (note.flashcards.length) {
    parts.push("## Flashcards", "")
    for (const c of note.flashcards) parts.push(`**Q:** ${c.question}  `, `**A:** ${c.answer}`, "")
  }
  return parts.join("\n")
}

function ReaderSkeleton() {
  return (
    <div className="mx-auto grid max-w-[780px] gap-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}

export function NoteView({ id }: { id: string }) {
  const router = useRouter()
  const confirm = useConfirm()
  const { data, error, mutate } = useNote(id)
  const { data: skills } = useSkills()
  const [recall, setRecall] = useStoredState("mnemo:recall-mode", false)
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [rating, setRating] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const openedAt = useRef(Date.now())

  const note = data?.note
  const skill = skills?.find((s) => s.id === note?.skillId)
  const headings = useMemo(() => (note ? extractHeadings(note.content) : []), [note])

  useEffect(() => {
    if (note) document.title = `${note.title} · Mnemo`
  }, [note])

  useEffect(() => {
    openedAt.current = Date.now()
    setResult(null)
    setFlipped({})
  }, [id])

  useHotkeys("e", () => router.push(`/notes/${id}/edit`), { enabled: Boolean(note) })

  if (error && !data) return <ErrorState error={error} onRetry={() => mutate()} title="Couldn't open this note" />
  if (!note || !data) return <ReaderSkeleton />

  const rate = async (r: Rating) => {
    setRating(true)
    try {
      const res = await api.reviewNote(note.id, r, Math.min(Date.now() - openedAt.current, 3_600_000))
      setResult(res)
      toast.success(`Next review ${res.srs.interval <= 1 ? "tomorrow" : `in ${formatInterval(res.srs.interval)}`}`, {
        description: `Mastery: ${MASTERY_META[res.mastery].label} (${res.masteryScore}%)`,
      })
      void mutate()
      void revalidateNotesData()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRating(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Delete “${note.title}”?`,
      description: "The note and its flashcards will be permanently deleted. Your study history is kept.",
      confirmLabel: "Delete note",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.deleteNote(note.id)
      toast.success("Note deleted")
      void revalidateNotesData()
      router.push(skill ? `/skills/${skill.id}` : "/notes")
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const due = new Date(note.srs.dueAt)
  const isDue = due <= new Date()
  const srs = result?.srs ?? note.srs

  return (
    <>
      <ReadingProgress />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_230px]">
        <article className="mx-auto w-full min-w-0 max-w-[800px]">
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-fg-3" aria-label="Breadcrumb">
            <Link href="/skills" className="transition-colors hover:text-fg">
              Skills
            </Link>
            <ChevronRight className="size-3.5" />
            {skill ? (
              <Link href={`/skills/${skill.id}`} className="truncate transition-colors hover:text-fg">
                {skill.name}
              </Link>
            ) : (
              <span>…</span>
            )}
          </nav>

          <header>
            <div className="flex flex-wrap items-center gap-2">
              {skill && <SkillChip name={skill.name} color={skill.color} />}
              <MasteryBadge level={result?.mastery ?? note.mastery} />
              {note.important && (
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-[color-mix(in_oklab,#f5b53d_40%,transparent)] bg-[color-mix(in_oklab,#f5b53d_12%,transparent)] px-2 text-[11.5px] font-medium text-warning-ink">
                  <Star className="size-3 fill-current" /> Important
                </span>
              )}
              <span className="inline-flex h-[22px] items-center rounded-full border border-border px-2 text-[11.5px] font-medium capitalize text-fg-3">
                {note.difficulty}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-[40px] sm:leading-[1.12]">{note.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fg-3 [&_svg]:size-4">
              <span className="inline-flex items-center gap-1.5">
                <Clock /> {note.stats.readingMinutes} min read
              </span>
              <span className={cn("inline-flex items-center gap-1.5", isDue && !result && "font-medium text-warning-ink")}>
                <CalendarClock />
                {result
                  ? `Next review ${format(new Date(srs.dueAt), "EEE, MMM d")}`
                  : !note.srs.reviewCount
                    ? "Not revised yet"
                    : isDue
                      ? "Due for revision"
                      : `Next review ${formatDistanceToNowStrict(due, { addSuffix: true })}`}
              </span>
              <span>Updated {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}</span>
            </div>
            {note.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.tags.map((t) => (
                  <Link key={t} href={`/notes?tag=${encodeURIComponent(t)}`} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-2 transition-colors hover:bg-primary-soft hover:text-primary-ink">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-border py-3">
              <Tooltip content="Blur key terms, highlights and code until you click them">
                <label className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2 py-1.5 text-sm transition-colors hover:bg-surface-2">
                  {recall ? <EyeOff className="size-4 text-primary-ink" /> : <Eye className="size-4 text-fg-3" />}
                  <span className="font-medium">Recall mode</span>
                  <Switch checked={recall} onCheckedChange={setRecall} aria-label="Recall mode" />
                </label>
              </Tooltip>
              <span className="ml-auto" />
              <Link href={`/notes/${note.id}/edit`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <Pencil /> Edit
              </Link>
              <a href="#rate" className={buttonVariants({ variant: "primary", size: "sm" })}>
                <Repeat /> Mark as revised
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="More actions">
                  <Ellipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {note.flashcards.length > 0 && (
                    <DropdownMenuItem icon={<Zap />} onSelect={() => router.push(`/revise/flashcards?note=${note.id}&mode=all`)}>
                      Study these flashcards
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem icon={<Download />} onSelect={() => downloadFile(`${safeFilename(note.title)}.md`, noteToMarkdown(note, skill?.name), "text/markdown")}>
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={<Link2 />}
                    onSelect={async () => {
                      if (await copyText(window.location.href)) toast.success("Link copied")
                    }}
                  >
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem icon={<Trash />} tone="danger" onSelect={remove}>
                    Delete note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <Takeaways key={`t-${recall}`} summary={note.summary} hidden={recall} className="mt-8" />

          <NoteRenderer key={`c-${recall}`} doc={note.content} recall={recall} className="mt-8" />

          {note.source && (
            <p className="mt-8 flex items-center gap-2 text-sm text-fg-3">
              <Link2 className="size-4" /> Source:{" "}
              {/^https?:\/\//i.test(note.source) ? (
                <a href={note.source} target="_blank" rel="noopener noreferrer nofollow" className="truncate text-primary-ink underline-offset-2 hover:underline">
                  {note.source}
                </a>
              ) : (
                <span className="truncate text-fg-2">{note.source}</span>
              )}
            </p>
          )}

          {note.flashcards.length > 0 && (
            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Zap className="size-5 text-primary-ink" /> Flashcards
                  <span className="rounded-full bg-surface-2 px-2 text-xs font-medium text-fg-3">{note.flashcards.length}</span>
                </h2>
                <Link href={`/revise/flashcards?note=${note.id}&mode=all`} className={buttonVariants({ variant: "soft", size: "sm" })}>
                  Study all <ArrowRight />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {note.flashcards.map((c) => (
                  <Flashcard
                    key={c.id}
                    question={c.question}
                    answer={c.answer}
                    flipped={Boolean(flipped[c.id])}
                    onFlip={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
                  />
                ))}
              </div>
            </section>
          )}

          <section id="rate" className="mt-12 scroll-mt-24">
            <Card className="relative overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(circle,var(--primary-soft),transparent_70%)]" />
              <AnimatePresence mode="wait" initial={false}>
                {result ? (
                  <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative flex flex-wrap items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success-ink">
                      <CalendarClock className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">Revised! Next review on {format(new Date(result.srs.dueAt), "EEEE, MMM d")}</div>
                      <div className="text-sm text-fg-3">
                        Mastery {MASTERY_META[result.mastery].label.toLowerCase()} · retention score {result.masteryScore}%
                      </div>
                    </div>
                    {data.next ? (
                      <Link href={`/notes/${data.next.id}`} className={buttonVariants({ variant: "primary" })}>
                        Next note <ArrowRight />
                      </Link>
                    ) : (
                      <Link href="/revise" className={buttonVariants({ variant: "primary" })}>
                        Revise more <ArrowRight />
                      </Link>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} className="relative">
                    <h2 className="text-lg font-semibold tracking-tight">How well do you remember this note?</h2>
                    <p className="mb-5 mt-1 text-sm text-fg-3">Your answer schedules the next review — sooner if it was hard, later if it was easy.</p>
                    <RatingBar srs={srs} onRate={(r) => void rate(r)} disabled={rating} hotkeys={false} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </section>

          {(data.prev || data.next) && (
            <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="More notes in this skill">
              {data.prev ? (
                <Link href={`/notes/${data.prev.id}`} className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                  <div className="flex items-center gap-1 text-xs text-fg-3">
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> Previous
                  </div>
                  <div className="mt-1 truncate font-medium group-hover:text-primary-ink">{data.prev.title}</div>
                </Link>
              ) : (
                <span />
              )}
              {data.next && (
                <Link href={`/notes/${data.next.id}`} className="group rounded-2xl border border-border bg-surface p-4 text-right transition-colors hover:border-border-strong">
                  <div className="flex items-center justify-end gap-1 text-xs text-fg-3">
                    Next <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-1 truncate font-medium group-hover:text-primary-ink">{data.next.title}</div>
                </Link>
              )}
            </nav>
          )}
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24 grid gap-6">
            <TableOfContents headings={headings} />
            <div className="rounded-2xl border border-border bg-surface p-4 text-[13px]">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-fg-3">Revision</div>
              <dl className="grid grid-cols-2 gap-y-2.5">
                <dt className="text-fg-3">Reviews</dt>
                <dd className="text-right font-medium tabular-nums">{srs.reviewCount}</dd>
                <dt className="text-fg-3">Interval</dt>
                <dd className="text-right font-medium">{srs.interval ? formatInterval(srs.interval) : "—"}</dd>
                <dt className="text-fg-3">Forgotten</dt>
                <dd className="text-right font-medium tabular-nums">{srs.lapses}×</dd>
                <dt className="text-fg-3">Last revised</dt>
                <dd className="text-right font-medium">{srs.lastReviewedAt ? formatDistanceToNowStrict(new Date(srs.lastReviewedAt), { addSuffix: true }) : "Never"}</dd>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
