"use client"

import Link from "next/link"
import { formatDistanceToNowStrict } from "date-fns"
import { Clock, CodeXml, SquareTerminal, Star, Zap } from "lucide-react"
import type { NoteSummaryDTO, SkillDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import { spotlightHandlers } from "@/components/motion/motion"
import { MasteryBadge, SkillChip, SkillIcon } from "@/components/skills/skill-visuals"

export function dueLabel(note: Pick<NoteSummaryDTO, "srs">): { text: string; tone: "new" | "due" | "later" } {
  if (!note.srs.reviewCount) return { text: "Not revised yet", tone: "new" }
  const due = new Date(note.srs.dueAt)
  if (due <= new Date()) return { text: "Due now", tone: "due" }
  return { text: `Revise ${formatDistanceToNowStrict(due, { addSuffix: true })}`, tone: "later" }
}

function Meta({ note }: { note: NoteSummaryDTO }) {
  const due = dueLabel(note)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3 [&_svg]:size-3.5">
      <span className="inline-flex items-center gap-1">
        <Clock /> {note.stats.readingMinutes} min
      </span>
      {note.stats.commands > 0 && (
        <span className="inline-flex items-center gap-1" title="Terminal commands">
          <SquareTerminal /> {note.stats.commands}
        </span>
      )}
      {note.stats.codeBlocks > 0 && (
        <span className="inline-flex items-center gap-1" title="Code snippets">
          <CodeXml /> {note.stats.codeBlocks}
        </span>
      )}
      {note.flashcardCount > 0 && (
        <span className="inline-flex items-center gap-1" title="Flashcards">
          <Zap /> {note.flashcardCount}
        </span>
      )}
      <span
        className={cn(
          "ml-auto font-medium",
          due.tone === "due" && "text-warning-ink",
          due.tone === "new" && "text-primary-ink",
        )}
      >
        {due.text}
      </span>
    </div>
  )
}

export function NoteCard({ note, skill, layout = "grid" }: { note: NoteSummaryDTO; skill?: SkillDTO; layout?: "grid" | "row" | "compact" }) {
  if (layout === "compact") {
    const due = dueLabel(note)
    return (
      <Link href={`/notes/${note.id}`} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2">
        {skill ? <SkillIcon icon={skill.icon} color={skill.color} size="sm" /> : <span className="size-8 shrink-0 rounded-lg bg-surface-2" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium transition-colors group-hover:text-primary-ink">{note.title}</span>
            {note.important && <Star className="size-3.5 shrink-0 fill-[#f5b53d] text-[#f5b53d]" aria-label="Important" />}
          </div>
          <div className="truncate text-xs text-fg-3">
            {skill && <span>{skill.name} · </span>}
            <span className={cn(due.tone === "due" && "font-medium text-warning-ink", due.tone === "new" && "font-medium text-primary-ink")}>{due.text}</span>
          </div>
        </div>
        <MasteryBadge level={note.mastery} className="shrink-0" />
      </Link>
    )
  }

  if (layout === "row") {
    return (
      <Link
        href={`/notes/${note.id}`}
        className="spotlight group flex flex-col gap-2 rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-border hover:bg-surface sm:flex-row sm:items-center sm:gap-4"
        {...spotlightHandlers()}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {note.important && <Star className="size-3.5 shrink-0 fill-[#f5b53d] text-[#f5b53d]" aria-label="Important" />}
            <h3 className="truncate text-[15px] font-medium tracking-tight transition-colors group-hover:text-primary-ink">{note.title}</h3>
          </div>
          {note.excerpt && <p className="mt-0.5 line-clamp-1 text-[13px] text-fg-3">{note.excerpt}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:w-[340px]">
          <MasteryBadge level={note.mastery} />
          <div className="flex-1">
            <Meta note={note} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/notes/${note.id}`}
      className="spotlight group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-pop"
      {...spotlightHandlers()}
    >
      <div className="flex items-center gap-2">
        {skill && <SkillChip name={skill.name} color={skill.color} className="max-w-[60%]" />}
        {note.important && <Star className="size-4 shrink-0 fill-[#f5b53d] text-[#f5b53d]" aria-label="Important" />}
        <span className="ml-auto">
          <MasteryBadge level={note.mastery} />
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary-ink">
          {note.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-fg-3">{note.excerpt || "No content yet."}</p>
      </div>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-fg-2">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto border-t border-border pt-3">
        <Meta note={note} />
      </div>
    </Link>
  )
}
