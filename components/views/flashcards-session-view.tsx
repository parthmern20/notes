"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import { Repeat, Shuffle } from "lucide-react"
import { api, apiFetch, cardsUrl, errorMessage, revalidateNotesData, useSkills } from "@/lib/client/api"
import { useHotkeys } from "@/lib/client/hooks"
import type { CardQueueItem, Rating } from "@/lib/types"
import { Flashcard, RatingBar } from "@/components/reader/revision-kit"
import { EmptySession, SessionHeader, SessionSummary, type SessionResult } from "@/components/revise/session-kit"
import { SkillChip } from "@/components/skills/skill-visuals"
import { buttonVariants } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { Tooltip } from "@/components/ui/overlays"
import { Kbd, Skeleton } from "@/components/ui/primitives"
import { ErrorState } from "@/components/ui/states"

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function FlashcardsSessionView() {
  const router = useRouter()
  const params = useSearchParams()
  const confirm = useConfirm()
  const skillId = params.get("skill") ?? undefined
  const noteId = params.get("note") ?? undefined
  const mode = params.get("mode") === "all" ? "all" : "due"

  const { data: skills } = useSkills()
  const [queue, setQueue] = useState<CardQueueItem[] | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<SessionResult[]>([])
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const itemStart = useRef(Date.now())

  useEffect(() => {
    let cancelled = false
    setQueue(null)
    setIndex(0)
    setResults([])
    setStartedAt(Date.now())
    apiFetch<CardQueueItem[]>(cardsUrl({ skillId, noteId, mode, limit: 200 }))
      .then((q) => !cancelled && setQueue(q))
      .catch((e) => !cancelled && setLoadError(e))
    return () => {
      cancelled = true
    }
  }, [skillId, noteId, mode])

  const current = queue?.[index]
  const finished = Boolean(queue && queue.length > 0 && index >= queue.length)
  const skill = skills?.find((s) => s.id === (current?.skillId ?? skillId))

  useEffect(() => {
    itemStart.current = Date.now()
    setFlipped(false)
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
    router.push(noteId ? `/notes/${noteId}` : skillId ? `/skills/${skillId}` : "/revise")
  }

  const rate = (rating: Rating) => {
    if (!current) return
    const ms = Date.now() - itemStart.current
    setResults((r) => [...r, { id: current.card.id, title: current.card.question, rating, ms, href: `/notes/${current.noteId}` }])
    setIndex((i) => i + 1)
    api.reviewCard(current.noteId, current.card.id, rating, Math.min(ms, 3_600_000)).catch((err) => {
      toast.error("Couldn't save that rating", { description: errorMessage(err) })
    })
  }

  useHotkeys(["space", "enter"], () => setFlipped((f) => !f), { enabled: Boolean(current) })
  useHotkeys("escape", () => void exit(), { enabled: !finished })

  if (loadError) return <ErrorState error={loadError} onRetry={() => location.reload()} title="Couldn't load your flashcards" />

  const scope = noteId ? "This note" : skillId ? (skills?.find((s) => s.id === skillId)?.name ?? "Skill") : "All skills"

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader
        title={`Flashcards · ${scope}`}
        subtitle={mode === "all" ? "Practising every card" : "Cards due today"}
        done={finished ? (queue?.length ?? 0) : index}
        total={queue?.length ?? 0}
        startedAt={startedAt}
        onExit={() => void exit()}
        right={
          queue && queue.length > 1 && !finished && index === 0 && !flipped ? (
            <Tooltip content="Shuffle the deck">
              <button
                type="button"
                onClick={() => setQueue((q) => (q ? shuffled(q) : q))}
                className="grid size-9 place-items-center rounded-[10px] text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Shuffle"
              >
                <Shuffle className="size-4" />
              </button>
            </Tooltip>
          ) : null
        }
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        {!queue ? (
          <Skeleton className="h-80 rounded-3xl" />
        ) : queue.length === 0 ? (
          <EmptySession kind="cards" skillId={skillId} />
        ) : finished ? (
          <SessionSummary
            results={results}
            startedAt={startedAt}
            kind="cards"
            actions={
              <>
                <Link href="/" className={buttonVariants({ variant: "secondary" })}>
                  Dashboard
                </Link>
                <Link href={`/revise/session${skillId ? `?skill=${skillId}` : ""}`} className={buttonVariants({ variant: "primary" })}>
                  <Repeat /> Review notes
                </Link>
              </>
            }
          />
        ) : current ? (
          <div className="my-auto grid gap-6">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                {skill && <SkillChip name={skill.name} color={skill.color} />}
                <Link href={`/notes/${current.noteId}`} className="truncate text-fg-3 hover:text-fg">
                  {current.noteTitle}
                </Link>
              </div>
              <span className="shrink-0 text-xs text-fg-3">
                Card {index + 1} of {queue.length}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.card.id}-${index}`}
                initial={{ opacity: 0, y: 30, rotate: -1.5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, x: -80, rotate: -4, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <Flashcard size="lg" question={current.card.question} answer={current.card.answer} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
              </motion.div>
            </AnimatePresence>
            <div className="min-h-[92px]">
              <AnimatePresence>
                {flipped ? (
                  <motion.div key="rate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <RatingBar srs={current.card.srs} onRate={rate} />
                  </motion.div>
                ) : (
                  <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 text-center text-sm text-fg-3">
                    Answer in your head, then flip with <Kbd>Space</Kbd>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
