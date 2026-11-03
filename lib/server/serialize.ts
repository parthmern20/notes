import { DEFAULT_EASE, masteryOf, masteryScore } from "@/lib/srs"
import { excerptOf } from "@/lib/doc"
import type { FlashcardDTO, NoteDTO, NoteSummaryDTO, Rating, SkillDTO, SkillStatsDTO, SrsDTO } from "@/lib/types"
import type { FlashcardDoc, NoteDoc, SkillDoc, SrsFields } from "./models"

const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : null)

export function srsDTO(s?: Partial<SrsFields> | null): SrsDTO {
  return {
    ease: s?.ease ?? DEFAULT_EASE,
    interval: s?.interval ?? 0,
    repetitions: s?.repetitions ?? 0,
    reviewCount: s?.reviewCount ?? 0,
    lapses: s?.lapses ?? 0,
    dueAt: iso(s?.dueAt) ?? new Date().toISOString(),
    lastReviewedAt: iso(s?.lastReviewedAt),
    lastRating: (s?.lastRating ?? null) as Rating | null,
  }
}

export function flashcardDTO(card: Pick<FlashcardDoc, "_id" | "question" | "answer"> & { srs?: Partial<SrsFields> }): FlashcardDTO {
  return { id: String(card._id), question: card.question, answer: card.answer, srs: srsDTO(card.srs) }
}

type SummarySource = Pick<NoteDoc, "_id" | "skillId" | "title" | "createdAt" | "updatedAt"> &
  Partial<Pick<NoteDoc, "contentText" | "summary" | "tags" | "difficulty" | "important" | "srs" | "stats" | "flashcards">>

export function noteSummaryDTO(n: SummarySource): NoteSummaryDTO {
  const srs = srsDTO(n.srs)
  return {
    id: String(n._id),
    skillId: String(n.skillId),
    title: n.title,
    excerpt: excerptOf(n.contentText ?? ""),
    summary: n.summary ?? "",
    tags: n.tags ?? [],
    difficulty: n.difficulty ?? "medium",
    important: Boolean(n.important),
    mastery: masteryOf(srs),
    masteryScore: masteryScore(srs),
    srs,
    stats: {
      words: n.stats?.words ?? 0,
      readingMinutes: n.stats?.readingMinutes ?? 1,
      codeBlocks: n.stats?.codeBlocks ?? 0,
      commands: n.stats?.commands ?? 0,
    },
    flashcardCount: n.flashcards?.length ?? 0,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }
}

export function noteDTO(n: NoteDoc): NoteDTO {
  return {
    ...noteSummaryDTO(n),
    content: n.content,
    source: n.source ?? "",
    flashcards: (n.flashcards ?? []).map(flashcardDTO),
  }
}

export const EMPTY_SKILL_STATS: SkillStatsDTO = {
  notes: 0,
  due: 0,
  flashcards: 0,
  cardsDue: 0,
  mastery: 0,
  mastered: 0,
  lastActivityAt: null,
}

export function skillDTO(s: SkillDoc, stats: SkillStatsDTO = EMPTY_SKILL_STATS): SkillDTO {
  return {
    id: String(s._id),
    name: s.name,
    description: s.description ?? "",
    color: s.color,
    icon: s.icon,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    stats,
  }
}

type StatsSource = Pick<NoteDoc, "skillId" | "srs" | "updatedAt"> & { flashcards?: { srs?: Partial<SrsFields> }[] }

/** Per-skill rollups computed from lightweight note projections. */
export function computeSkillStats(notes: StatsSource[], now = new Date()): Map<string, SkillStatsDTO> {
  const acc = new Map<string, SkillStatsDTO & { scoreSum: number }>()
  for (const n of notes) {
    const key = String(n.skillId)
    const s = acc.get(key) ?? { ...EMPTY_SKILL_STATS, scoreSum: 0 }
    const srs = srsDTO(n.srs)
    s.notes += 1
    if (new Date(srs.dueAt) <= now) s.due += 1
    s.scoreSum += masteryScore(srs)
    if (masteryOf(srs) === "mastered") s.mastered += 1
    for (const c of n.flashcards ?? []) {
      s.flashcards += 1
      if (!c.srs?.dueAt || new Date(c.srs.dueAt) <= now) s.cardsDue += 1
    }
    const activity = [n.updatedAt, n.srs?.lastReviewedAt].filter(Boolean).map((d) => new Date(d as Date).getTime())
    const latest = Math.max(...activity, s.lastActivityAt ? Date.parse(s.lastActivityAt) : 0)
    s.lastActivityAt = latest ? new Date(latest).toISOString() : null
    acc.set(key, s)
  }
  const out = new Map<string, SkillStatsDTO>()
  for (const [key, { scoreSum, ...s }] of acc) out.set(key, { ...s, mastery: s.notes ? Math.round(scoreSum / s.notes) : 0 })
  return out
}
