import { dueDateAfter } from "@/lib/dates"
import { HttpError, json, readJson, route, timeZoneOf, toObjectId, type IdContext } from "@/lib/server/http"
import { Note, Review } from "@/lib/server/models"
import { srsDTO } from "@/lib/server/serialize"
import { reviewSchema } from "@/lib/server/validators"
import { masteryOf, masteryScore, schedule } from "@/lib/srs"
import type { ReviewResult } from "@/lib/types"

export const POST = route(async (req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const { rating, durationMs } = await readJson(req, reviewSchema)
  const note = await Note.findById(_id, { srs: 1, skillId: 1 }).lean()
  if (!note) throw new HttpError(404, "Note not found")

  const now = new Date()
  const prev = srsDTO(note.srs)
  const next = schedule(prev, rating)
  const srs = { ...next, dueAt: dueDateAfter(now, next.interval, timeZoneOf(req)), lastReviewedAt: now }

  await Promise.all([
    Note.updateOne({ _id }, { $set: { srs } }, { timestamps: false }),
    Review.create({
      noteId: _id,
      skillId: note.skillId,
      kind: "note",
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
