"use client"

import { Fragment, useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { motion, useScroll, useSpring } from "motion/react"
import { RotateCcw } from "lucide-react"
import type { HeadingInfo } from "@/lib/doc"
import { useHotkeys, useMounted } from "@/lib/client/hooks"
import { formatInterval, previewIntervals, RATING_META, RATINGS, type SrsCore } from "@/lib/srs"
import type { Rating } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/primitives"

// ───────────── Table of contents with scroll-spy ─────────────

export function TableOfContents({ headings, className }: { headings: HeadingInfo[]; className?: string }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => !!el)
    if (!elements.length) return
    const visible = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting)
        const first = headings.find((h) => visible.get(h.id))
        if (first) setActive(first.id)
      },
      { rootMargin: "-88px 0px -65% 0px" },
    )
    elements.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [headings])

  if (!headings.length) return null
  const minLevel = Math.min(...headings.map((h) => h.level))

  return (
    <nav aria-label="On this page" className={className}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-3">On this page</div>
      <ul className="relative grid gap-0.5 border-l border-border">
        {headings.map((h) => {
          const isActive = h.id === active
          return (
            <li key={h.id} className="relative">
              {isActive && (
                <motion.span
                  layoutId="toc-active"
                  className="absolute -left-px top-1 h-[calc(100%-8px)] w-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  history.replaceState(null, "", `#${h.id}`)
                }}
                style={{ paddingLeft: `${(h.level - minLevel) * 12 + 12}px` }}
                className={cn(
                  "block truncate py-1 pr-2 text-[13px] transition-colors",
                  isActive ? "font-medium text-fg" : "text-fg-3 hover:text-fg-2",
                )}
              >
                {h.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ───────────── Reading progress ─────────────

export function ReadingProgress() {
  const mounted = useMounted()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 })
  if (!mounted) return null
  return createPortal(
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-[linear-gradient(90deg,var(--primary),var(--accent-2))]"
    />,
    document.body,
  )
}

// ───────────── Flashcards ─────────────

/** Flashcard text: line breaks and `inline code` are honoured; everything else is plain text. */
export function CardText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(`[^`]+`)/g).map((part, j) =>
            part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
              <code key={j} className="inline-code">
                {part.slice(1, -1)}
              </code>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  )
}

export function Flashcard({
  question,
  answer,
  flipped,
  onFlip,
  meta,
  size = "md",
}: {
  question: string
  answer: string
  flipped: boolean
  onFlip: () => void
  meta?: ReactNode
  size?: "md" | "lg"
}) {
  const face =
    "flex flex-col rounded-3xl border p-6 [backface-visibility:hidden] [grid-area:1/1] [-webkit-backface-visibility:hidden] sm:p-8"
  return (
    <div className="[perspective:1600px]">
      <motion.button
        type="button"
        onClick={onFlip}
        aria-label={flipped ? "Show question" : "Reveal answer"}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 24 }}
        className={cn("grid w-full cursor-pointer text-left [transform-style:preserve-3d]", size === "lg" ? "min-h-[340px]" : "min-h-[220px]")}
      >
        <div
          className={cn(
            face,
            "border-border bg-surface shadow-pop bg-[radial-gradient(120%_80%_at_0%_0%,var(--primary-soft),transparent_60%)]",
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-fg-3">
            <span>Question</span>
            {meta}
          </div>
          <div className={cn("my-auto py-6 font-semibold leading-snug tracking-tight", size === "lg" ? "text-2xl sm:text-[26px]" : "text-lg")}>
            <CardText text={question} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-fg-3">
            <RotateCcw className="size-3.5" /> Click or press <Kbd>Space</Kbd> to reveal
          </div>
        </div>
        <div
          className={cn(
            face,
            "[transform:rotateY(180deg)] border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] bg-surface shadow-glow bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--accent-2)_14%,transparent),transparent_60%)]",
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-ink">Answer</div>
          <div className={cn("my-auto whitespace-pre-wrap py-6 leading-relaxed", size === "lg" ? "text-lg sm:text-xl" : "text-base")}>
            <CardText text={answer} />
          </div>
          <div className="line-clamp-1 text-xs text-fg-3">Q: {question}</div>
        </div>
      </motion.button>
    </div>
  )
}

// ───────────── Rating ─────────────

const TONES: Record<string, string> = {
  again: "[--tone:var(--danger)] text-danger-ink",
  hard: "[--tone:var(--warning)] text-warning-ink",
  good: "[--tone:var(--success)] text-success-ink",
  easy: "[--tone:var(--info)] text-info-ink",
}

/** Again / Hard / Good / Easy, each labelled with when that choice schedules the next review. Keys 1–4. */
export function RatingBar({
  srs,
  onRate,
  disabled,
  hotkeys = true,
  className,
}: {
  srs: SrsCore
  onRate: (rating: Rating) => void
  disabled?: boolean
  hotkeys?: boolean
  className?: string
}) {
  const preview = previewIntervals(srs)
  useHotkeys(["1", "2", "3", "4"], (e) => onRate(Number(e.key) as Rating), { enabled: hotkeys && !disabled })
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {RATINGS.map((r) => {
        const meta = RATING_META[r]
        return (
          <button
            key={r}
            type="button"
            disabled={disabled}
            onClick={() => onRate(r)}
            title={meta.hint}
            className={cn(
              "group relative flex flex-col items-center gap-0.5 rounded-2xl border border-[color-mix(in_oklab,var(--tone)_35%,var(--border))] bg-[color-mix(in_oklab,var(--tone)_8%,var(--surface))] px-3 py-3 transition-all hover:-translate-y-0.5 hover:bg-[color-mix(in_oklab,var(--tone)_14%,var(--surface))] hover:shadow-[0_10px_24px_-14px_var(--tone)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
              TONES[meta.tone],
            )}
          >
            <span className="text-[15px] font-semibold">{meta.label}</span>
            <span className="text-xs text-fg-3">{formatInterval(preview[r])}</span>
            <Kbd className="absolute right-2 top-2 hidden opacity-70 sm:inline-flex">{r}</Kbd>
          </button>
        )
      })}
    </div>
  )
}
