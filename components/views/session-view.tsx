"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { preload } from "swr"
import { toast } from "sonner"
import { Brain, Eye, EyeOff, ListTree, Zap } from "lucide-react"
import { api, apiFetch, errorMessage, fetcher, queueUrl, revalidateNotesData, useNote, useSkills } from "@/lib/client/api"
import { useHotkeys, useStoredState } from "@/lib/client/hooks"
import { extractHeadings } from "@/lib/doc"
import type { NoteSummaryDTO, Rating, ReviewMode } from "@/lib/types"
import { NoteRenderer } from "@/components/reader/note-renderer"
import { RatingBar } from "@/components/reader/revision-kit"
import { Takeaways } from "@/components/reader/takeaways"
import { EmptySession, SessionHeader, SessionSummary, type SessionResult } from "@/components/revise/session-kit"
import { MasteryBadge, SkillChip } from "@/components/skills/skill-visuals"
import { Button, buttonVariants } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { Switch, Tooltip } from "@/components/ui/overlays"
import { Card, Kbd, Skeleton } from "@/components/ui/primitives"
import { ErrorState } from "@/components/ui/states"

const MODE_LABEL: Record<ReviewMode, string> = { due: "Due notes", all: "All notes", weak: "Weak spots", important: "Important notes" }
const MODES: ReviewMode[] = ["due", "all", "weak", "important"]

export function SessionView() {
  const router = useRouter()
  const params = useSearchParams()
  const confirm = useConfirm()
  const skillId = params.get("skill") ?? undefined
  const rawMode = params.get("mode") as ReviewMode | null
  const mode: ReviewMode = rawMode && MODES.includes(rawMode) ? rawMode : "due"

  const { data: skills } = useSkills()
  const [queue, setQueue] = useState<NoteSummaryDTO[] | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])
  const [recall, setRecall] = useStoredState("mnemo:session-recall", true)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const itemStart = useRef(Date.now())

  // Snapshot the queue once — it must not shift while you work through it.
  useEffect(() => {
    let cancelled = false
    setQueue(null)
    setIndex(0)
    setResults([])
    setStartedAt(Date.now())
    apiFetch<NoteSummaryDTO[]>(queueUrl({ skillId, mode, limit: 60 }))
      .then((q) => !cancelled && setQueue(q))
      .catch((e) => !cancelled && setLoadError(e))
    return () => {
      cancelled = true
    }
  }, [skillId, mode])

  const current = queue?.[index]
  const finished = Boolean(queue && queue.length > 0 && index >= queue.length)
  const { data: noteData } = useNote(current?.id)
  const note = noteData?.note.id === current?.id ? noteData?.note : undefined
  const headings = useMemo(() => (note ? extractHeadings(note.content) : []), [note])
  const skill = skills?.find((s) => s.id === (current?.skillId ?? skillId))
  const scopeSkill = skillId ? skills?.find((s) => s.id === skillId) : undefined

  useEffect(() => {
    const next = queue?.[index + 1]
    if (next) void preload(`/api/notes/${next.id}`, fetcher)
  }, [queue, index])

  useEffect(() => {
    itemStart.current = Date.now()
    setRevealed(false)
    window.scrollTo({ top: 0 })
  }, [index])

  useEffect(() => {
    if (finished) void revalidateNotesData()
  }, [finished])

  const exit = async () => {
    if (results.length && !finished) {
      const ok = await confirm({ title: "Leave this session?", description: `Your ${results.length} ratings so far are saved.`, confirmLabel: "Leave" })
      if (!ok) return
    }
    void revalidateNotesData()
    router.push(skillId ? `/skills/${skillId}` : "/revise")
  }

  const rate = (rating: Rating) => {
    if (!current) return
    const ms = Date.now() - itemStart.current
    setResults((r) => [...r, { id: current.id, title: current.title, rating, ms, href: `/notes/${current.id}` }])
    setIndex((i) => i + 1)
    api.reviewNote(current.id, rating, Math.min(ms, 3_600_000)).catch((err) => {
      toast.error(`Couldn't save your rating for “${current.title}”`, { description: errorMessage(err) })
    })
  }

  useHotkeys("space", () => setRevealed(true), { enabled: Boolean(current) && !revealed })
  useHotkeys("escape", () => void exit(), { enabled: !finished })

  const title = scopeSkill ? `${scopeSkill.name} · ${MODE_LABEL[mode]}` : `Revision · ${MODE_LABEL[mode]}`

  if (loadError) return <ErrorState error={loadError} onRetry={() => location.reload()} title="Couldn't start the session" />

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader
        title={title}
        subtitle={current ? current.title : finished ? "Finished" : "Loading…"}
        done={finished ? (queue?.length ?? 0) : index}
        total={queue?.length ?? 0}
        startedAt={startedAt}
        onExit={() => void exit()}
        right={
          <Tooltip content="Recall mode: blur key terms until clicked">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-fg-2 hover:bg-surface-2">
              {recall ? <EyeOff className="size-4 text-primary-ink" /> : <Eye className="size-4" />}
              <span className="hidden sm:inline">Recall</span>
              <Switch checked={recall} onCheckedChange={setRecall} aria-label="Recall mode" />
            </label>
          </Tooltip>
        }
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {!queue ? (
          <div className="grid gap-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : queue.length === 0 ? (
          <EmptySession kind="notes" skillId={skillId} />
        ) : finished ? (
          <SessionSummary
            results={results}
            startedAt={startedAt}
            kind="notes"
            actions={
              <>
                <Link href="/" className={buttonVariants({ variant: "secondary" })}>
                  Dashboard
                </Link>
                <Link href={`/revise/flashcards${skillId ? `?skill=${skillId}` : ""}`} className={buttonVariants({ variant: "secondary" })}>
                  <Zap /> Flashcards
                </Link>
                {results.some((r) => r.rating <= 2) && (
                  <Link href={`/revise/session?${skillId ? `skill=${skillId}&` : ""}mode=weak`} className={buttonVariants({ variant: "primary" })}>
                    Practise weak spots
                  </Link>
                )}
              </>
            }
          />
        ) : current ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.id}-${index}`}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {skill && <SkillChip name={skill.name} color={skill.color} />}
                <MasteryBadge level={current.mastery} />
                {current.tags.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-fg-2">
                    #{t}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{current.title}</h1>

              {!revealed ? (
                <Card className="relative mt-8 overflow-hidden p-6 sm:p-8">
                  <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-[radial-gradient(circle,var(--primary-soft),transparent_70%)]" />
                  <div className="relative">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-ink">
                      <Brain className="size-4" /> Recall first
                    </div>
                    <p className="text-[15px] leading-relaxed text-fg-2">
                      Before you look, explain this topic to yourself: the key ideas, commands and gotchas. Retrieving it is what makes it stick.
                    </p>
                    {headings.length > 0 && (
                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-3">
                          <ListTree className="size-3.5" /> Cues — sections in this note
                        </div>
                        <ul className="grid gap-1 text-sm text-fg-2">
                          {headings.map((h) => (
                            <li key={h.id} style={{ paddingLeft: (h.level - 1) * 14 }} className="before:mr-2 before:text-fg-3 before:content-['•']">
                              {h.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button variant="primary" size="lg" className="mt-7" onClick={() => setRevealed(true)}>
                      <Eye /> Show note <Kbd className="ml-1 border-white/25 bg-white/15 text-white">Space</Kbd>
                    </Button>
                  </div>
                </Card>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-8 pb-40">
                  {note ? (
                    <>
                      <Takeaways summary={note.summary} hidden={recall} />
                      <NoteRenderer doc={note.content} recall={recall} />
                    </>
                  ) : (
                    <div className="grid gap-3">
                      <Skeleton className="h-24 rounded-2xl" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </main>

      {current && revealed && !finished && (
        <motion.footer
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="sticky bottom-0 z-30 border-t border-border/70 bg-[color-mix(in_oklab,var(--bg)_86%,transparent)] py-4 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">How well did you remember it?</span>
              <span className="hidden text-xs text-fg-3 sm:inline">
                Press <Kbd>1</Kbd>–<Kbd>4</Kbd>
              </span>
            </div>
            <RatingBar srs={current.srs} onRate={rate} />
          </div>
        </motion.footer>
      )}
    </div>
  )
}
