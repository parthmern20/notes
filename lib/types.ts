import type { DocNode } from "./doc"

export type Rating = 1 | 2 | 3 | 4
export type MasteryLevel = "new" | "learning" | "familiar" | "mastered"
export type Difficulty = "easy" | "medium" | "hard"
export type ReviewMode = "due" | "all" | "weak" | "important"

export interface SrsDTO {
  ease: number
  interval: number
  repetitions: number
  reviewCount: number
  lapses: number
  dueAt: string
  lastReviewedAt: string | null
  lastRating: Rating | null
}

export interface SkillStatsDTO {
  notes: number
  due: number
  flashcards: number
  cardsDue: number
  mastery: number
  mastered: number
  lastActivityAt: string | null
}

export interface SkillDTO {
  id: string
  name: string
  description: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
  stats: SkillStatsDTO
}

export interface SkillInput {
  name: string
  description?: string
  color: string
  icon: string
}

export interface FlashcardDTO {
  id: string
  question: string
  answer: string
  srs: SrsDTO
}

export interface NoteStatsDTO {
  words: number
  readingMinutes: number
  codeBlocks: number
  commands: number
}

export interface NoteSummaryDTO {
  id: string
  skillId: string
  title: string
  excerpt: string
  /** Key takeaways, one per line. */
  summary: string
  tags: string[]
  difficulty: Difficulty
  important: boolean
  mastery: MasteryLevel
  masteryScore: number
  srs: SrsDTO
  stats: NoteStatsDTO
  flashcardCount: number
  createdAt: string
  updatedAt: string
}

export interface NoteDTO extends NoteSummaryDTO {
  content: DocNode
  source: string
  flashcards: FlashcardDTO[]
}

export interface NoteNeighbor {
  id: string
  title: string
}

export interface NoteResponse {
  note: NoteDTO
  prev: NoteNeighbor | null
  next: NoteNeighbor | null
}

export interface FlashcardInput {
  id?: string
  question: string
  answer: string
}

export interface NoteInput {
  skillId: string
  title: string
  content: DocNode
  summary: string
  tags: string[]
  difficulty: Difficulty
  important: boolean
  source: string
  flashcards: FlashcardInput[]
}

export interface ReviewResult {
  srs: SrsDTO
  mastery: MasteryLevel
  masteryScore: number
}

export interface CardQueueItem {
  noteId: string
  noteTitle: string
  skillId: string
  card: FlashcardDTO
}

export interface SnippetDTO {
  noteId: string
  noteTitle: string
  kind: "code" | "terminal"
  language: string
  code: string
  heading: string | null
}

export interface SearchNoteHit {
  id: string
  title: string
  skillId: string
  context: string
  tags: string[]
}

export interface SearchResponse {
  notes: SearchNoteHit[]
  skills: { id: string; name: string; color: string; icon: string }[]
}

export interface DailyPoint {
  date: string
  reviews: number
  cards: number
  notes: number
  minutes: number
  /** Reviews and flashcards rated Good or Easy. */
  recalled: number
}

export interface PeriodTotals {
  reviews: number
  cards: number
  minutes: number
  notes: number
  recallRate: number | null
}

export interface SkillProgressDTO {
  id: string
  name: string
  color: string
  icon: string
  notes: number
  due: number
  mastery: number
  mastered: number
}

export interface StatsDTO {
  generatedAt: string
  timeZone: string
  totals: {
    skills: number
    notes: number
    flashcards: number
    words: number
    commands: number
    codeBlocks: number
    notesThisWeek: number
  }
  due: {
    notes: number
    cards: number
    newNotes: number
    reviewedToday: number
    cardsReviewedToday: number
  }
  streak: { current: number; longest: number; activeToday: boolean }
  mastery: { counts: Record<MasteryLevel, number>; average: number }
  range: { days: number; current: PeriodTotals; previous: PeriodTotals }
  daily: DailyPoint[]
  heatmap: { date: string; count: number }[]
  forecast: { date: string; notes: number; cards: number }[]
  skills: SkillProgressDTO[]
}

export interface MetaDTO {
  ai: boolean
  aiModel: string | null
  database: string | null
}

export interface BackupFile {
  app: "mnemo"
  version: 1
  exportedAt: string
  skills: Record<string, unknown>[]
  notes: Record<string, unknown>[]
  reviews: Record<string, unknown>[]
}
