import type { MasteryLevel, Rating } from "./types"

// A compact SM-2 variant: ease 1.3–3.0, day-granular intervals, capped at a year.
export const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const MAX_EASE = 3.0
const MAX_INTERVAL = 365
const MASTERED_INTERVAL = 21

export interface SrsCore {
  ease: number
  interval: number
  repetitions: number
  reviewCount: number
  lapses: number
}

export interface ScheduleResult extends SrsCore {
  lastRating: Rating
}

export const RATINGS: Rating[] = [1, 2, 3, 4]

export const RATING_META: Record<Rating, { label: string; hint: string; tone: "again" | "hard" | "good" | "easy" }> = {
  1: { label: "Again", hint: "I forgot it", tone: "again" },
  2: { label: "Hard", hint: "Recalled with effort", tone: "hard" },
  3: { label: "Good", hint: "Recalled after a moment", tone: "good" },
  4: { label: "Easy", hint: "Knew it instantly", tone: "easy" },
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function schedule(prev: SrsCore, rating: Rating): ScheduleResult {
  let { ease, interval, repetitions, lapses } = prev

  if (rating === 1) {
    if (repetitions > 0) lapses += 1
    repetitions = 0
    interval = 1
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE)
  } else {
    if (repetitions === 0) {
      interval = rating === 2 ? 1 : rating === 3 ? 2 : 4
    } else if (rating === 2) {
      interval = Math.max(interval + 1, Math.round(interval * 1.2))
    } else if (rating === 3) {
      interval = Math.max(interval + 1, Math.round(interval * ease))
    } else {
      interval = Math.max(interval + 2, Math.round(interval * ease * 1.3))
    }
    ease = clamp(ease + (rating === 2 ? -0.15 : rating === 4 ? 0.15 : 0), MIN_EASE, MAX_EASE)
    repetitions += 1
  }

  return {
    ease: Math.round(ease * 100) / 100,
    interval: Math.min(interval, MAX_INTERVAL),
    repetitions,
    reviewCount: prev.reviewCount + 1,
    lapses,
    lastRating: rating,
  }
}

export function previewIntervals(prev: SrsCore): Record<Rating, number> {
  return {
    1: schedule(prev, 1).interval,
    2: schedule(prev, 2).interval,
    3: schedule(prev, 3).interval,
    4: schedule(prev, 4).interval,
  }
}

export function formatInterval(days: number): string {
  if (days < 1) return "today"
  if (days < 14) return `${days}d`
  if (days < 60) return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round((days / 365) * 10) / 10}y`
}

export const MASTERY_LEVELS: MasteryLevel[] = ["new", "learning", "familiar", "mastered"]

export const MASTERY_META: Record<MasteryLevel, { label: string; description: string }> = {
  new: { label: "New", description: "Not revised yet" },
  learning: { label: "Learning", description: "Revisiting within a week" },
  familiar: { label: "Familiar", description: "Remembered for 1–3 weeks" },
  mastered: { label: "Mastered", description: `Remembered for ${MASTERED_INTERVAL}+ days` },
}

export function masteryOf(srs: Pick<SrsCore, "reviewCount" | "interval">): MasteryLevel {
  if (!srs.reviewCount) return "new"
  if (srs.interval >= MASTERED_INTERVAL) return "mastered"
  if (srs.interval >= 7) return "familiar"
  return "learning"
}

/** 0–100 retention score: logarithmic in the interval, 100 once the interval reaches the mastered threshold. */
export function masteryScore(srs: Pick<SrsCore, "reviewCount" | "interval">): number {
  if (!srs.reviewCount) return 0
  const score = (Math.log(1 + srs.interval) / Math.log(1 + MASTERED_INTERVAL)) * 100
  return Math.round(clamp(score, 0, 100))
}
