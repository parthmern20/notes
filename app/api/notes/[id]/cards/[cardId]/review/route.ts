import { dueDateAfter } from "@/lib/dates"
import { HttpError, json, readJson, route, timeZoneOf, toObjectId } from "@/lib/server/http"
import { Note, Review } from "@/lib/server/models"
import { srsDTO } from "@/lib/server/serialize"
import { reviewSchema } from "@/lib/server/validators"
import { masteryOf, masteryScore, schedule } from "@/lib/srs"
import type { ReviewResult } from "@/lib/types"

type Ctx = { params: Promise<{ id: string; cardId: string }> }

export const POST = route(async (req, { params }: Ctx) => {
  const { id, cardId } = await params
  const _id = toObjectId(id)
  const cid = toObjectId(cardId)
  const { rating, durationMs } = await readJson(req, reviewSchema)
  const note = await Note.findOne({ _id, "flashcards._id": cid }, { skillId: 1, "flashcards.$": 1 }).lean()
  const card = note?.flashcards?.[0]
  if (!note || !card) throw new HttpError(404, "Flashcard not found")

  const now = new Date()
  const prev = srsDTO(card.srs)
  const next = schedule(prev, rating)
  const srs = { ...next, dueAt: dueDateAfter(now, next.interval, timeZoneOf(req)), lastReviewedAt: now }

  await Promise.all([
    Note.updateOne({ _id, "flashcards._id": cid }, { $set: { "flashcards.$.srs": srs } }, { timestamps: false }),
    Review.create({
      noteId: _id,
      skillId: note.skillId,
      cardId: cid,
      kind: "card",
      rating,
      durationMs,
      intervalBefore: prev.interval,
      intervalAfter: next.interval,
      reviewedAt: now,
    }),
  ])

  const dto = srsDTO(srs)
  const body: ReviewResult = { srs: dto, mastery: masteryOf(dto), masteryScore: masteryScore(dto) }
  return json(body)
})
