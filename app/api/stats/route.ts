import { addDaysToKey, dayKey, diffKeys, zonedMidnight } from "@/lib/dates"
import { json, route, timeZoneOf } from "@/lib/server/http"
import { Note, Review, Skill, type NoteDoc, type SrsFields } from "@/lib/server/models"
import { computeSkillStats, EMPTY_SKILL_STATS, srsDTO } from "@/lib/server/serialize"
import { masteryOf, masteryScore } from "@/lib/srs"
import type { MasteryLevel, PeriodTotals, StatsDTO } from "@/lib/types"

const HEATMAP_DAYS = 371 // 53 weeks
const FORECAST_DAYS = 14

interface Bucket {
  reviews: number
  cards: number
  notes: number
  ms: number
  recalled: number
}

type StatsNote = Pick<NoteDoc, "_id" | "skillId" | "srs" | "stats" | "createdAt" | "updatedAt"> & {
  flashcards?: { srs?: Partial<SrsFields> }[]
}

interface ReviewDay {
  _id: { day: string; kind: "note" | "card" }
  count: number
  ms: number
  recalled: number
}

export const GET = route(async (req) => {
  const tz = timeZoneOf(req)
  const requested = Number(new URL(req.url).searchParams.get("days"))
  const days = [7, 30, 90].includes(requested) ? requested : 30
  const now = new Date()
  const todayKey = dayKey(now, tz)
  const sinceKey = addDaysToKey(todayKey, -(Math.max(HEATMAP_DAYS, days * 2) - 1))
  const since = zonedMidnight(sinceKey, tz)

  const [skills, notes, reviewDays] = await Promise.all([
    Skill.find().sort({ order: 1, createdAt: 1 }).lean(),
    Note.find({}, { skillId: 1, srs: 1, stats: 1, createdAt: 1, updatedAt: 1, "flashcards.srs": 1 }).lean<StatsNote[]>(),
    Review.aggregate<ReviewDay>([
      { $match: { reviewedAt: { $gte: since } } },
      {
        $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: tz } }, kind: "$kind" },
          count: { $sum: 1 },
          ms: { $sum: "$durationMs" },
          recalled: { $sum: { $cond: [{ $gte: ["$rating", 3] }, 1, 0] } },
        },
      },
    ]),
  ])

  const buckets = new Map<string, Bucket>()
  const bucket = (key: string) => {
    let b = buckets.get(key)
    if (!b) buckets.set(key, (b = { reviews: 0, cards: 0, notes: 0, ms: 0, recalled: 0 }))
    return b
  }
  for (const r of reviewDays) {
    const b = bucket(r._id.day)
    if (r._id.kind === "card") b.cards += r.count
    else b.reviews += r.count
    b.ms += r.ms
    b.recalled += r.recalled
  }
  for (const n of notes) {
    const key = dayKey(n.createdAt, tz)
    if (key >= sinceKey) bucket(key).notes += 1
  }

  const activity = (key: string) => {
    const b = buckets.get(key)
    return b ? b.reviews + b.cards + b.notes : 0
  }

  const heatmap = Array.from({ length: HEATMAP_DAYS }, (_, i) => {
    const date = addDaysToKey(todayKey, i - (HEATMAP_DAYS - 1))
    return { date, count: activity(date) }
  })

  // A streak survives until the end of today, so an inactive today still shows yesterday's run.
  const activeToday = activity(todayKey) > 0
  let current = 0
  for (let cursor = activeToday ? todayKey : addDaysToKey(todayKey, -1); activity(cursor) > 0; cursor = addDaysToKey(cursor, -1)) {
    current += 1
  }
  let longest = 0
  let run = 0
  for (const { count } of heatmap) {
    run = count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }

  const period = (offset: number): PeriodTotals => {
    const t = { reviews: 0, cards: 0, ms: 0, notes: 0, recalled: 0 }
    for (let i = 0; i < days; i++) {
      const b = buckets.get(addDaysToKey(todayKey, -(offset + i)))
      if (!b) continue
      t.reviews += b.reviews
      t.cards += b.cards
      t.ms += b.ms
      t.notes += b.notes
      t.recalled += b.recalled
    }
    const attempts = t.reviews + t.cards
    return {
      reviews: t.reviews,
      cards: t.cards,
      minutes: Math.round(t.ms / 60_000),
      notes: t.notes,
      recallRate: attempts ? Math.round((t.recalled / attempts) * 100) : null,
    }
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const date = addDaysToKey(todayKey, i - (days - 1))
    const b = buckets.get(date)
    return {
      date,
      reviews: b?.reviews ?? 0,
      cards: b?.cards ?? 0,
      notes: b?.notes ?? 0,
      minutes: b ? Math.round(b.ms / 6_000) / 10 : 0,
      recalled: b?.recalled ?? 0,
    }
  })

  const forecast = Array.from({ length: FORECAST_DAYS }, (_, i) => ({ date: addDaysToKey(todayKey, i), notes: 0, cards: 0 }))
  const forecastSlot = (due: Date) => {
    const diff = diffKeys(dayKey(due, tz), todayKey)
    return diff <= 0 ? 0 : diff < FORECAST_DAYS ? diff : -1
  }

  const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 }
  const weekAgo = zonedMidnight(addDaysToKey(todayKey, -6), tz)
  let scoreSum = 0
  let dueNotes = 0
  let dueCards = 0
  let newNotes = 0
  let flashcards = 0
  let words = 0
  let commands = 0
  let codeBlocks = 0
  let notesThisWeek = 0

  for (const n of notes) {
    const srs = srsDTO(n.srs)
    counts[masteryOf(srs)] += 1
    scoreSum += masteryScore(srs)
    if (!srs.reviewCount) newNotes += 1
    const due = new Date(srs.dueAt)
    if (due <= now) dueNotes += 1
    const slot = forecastSlot(due)
    if (slot >= 0) forecast[slot].notes += 1
    for (const c of n.flashcards ?? []) {
      flashcards += 1
      const cardDue = c.srs?.dueAt ? new Date(c.srs.dueAt) : now
      if (cardDue <= now) dueCards += 1
      const s = forecastSlot(cardDue)
      if (s >= 0) forecast[s].cards += 1
    }
    words += n.stats?.words ?? 0
    commands += n.stats?.commands ?? 0
    codeBlocks += n.stats?.codeBlocks ?? 0
    if (n.createdAt >= weekAgo) notesThisWeek += 1
  }

  const skillStats = computeSkillStats(notes, now)
  const today = buckets.get(todayKey)

  const body: StatsDTO = {
    generatedAt: now.toISOString(),
    timeZone: tz,
    totals: { skills: skills.length, notes: notes.length, flashcards, words, commands, codeBlocks, notesThisWeek },
    due: {
      notes: dueNotes,
      cards: dueCards,
      newNotes,
      reviewedToday: today?.reviews ?? 0,
      cardsReviewedToday: today?.cards ?? 0,
    },
    streak: { current, longest, activeToday },
    mastery: { counts, average: notes.length ? Math.round(scoreSum / notes.length) : 0 },
    range: { days, current: period(0), previous: period(days) },
    daily,
    heatmap,
    forecast,
    skills: skills.map((s) => {
      const st = skillStats.get(String(s._id)) ?? EMPTY_SKILL_STATS
      return {
        id: String(s._id),
        name: s.name,
        color: s.color,
        icon: s.icon,
        notes: st.notes,
        due: st.due,
        mastery: st.mastery,
        mastered: st.mastered,
      }
    }),
  }
  return json(body)
})
