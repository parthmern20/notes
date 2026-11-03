import { HttpError, json, readJson, route, toObjectId } from "@/lib/server/http"
import { Note, Skill } from "@/lib/server/models"
import { derivedFields, freshSrs, LIST_PROJECTION, mergeFlashcards } from "@/lib/server/notes"
import { noteDTO, noteSummaryDTO } from "@/lib/server/serialize"
import { noteCreateSchema } from "@/lib/server/validators"
import { escapeRegex, normalizeTag } from "@/lib/utils"

const SORTS: Record<string, Record<string, 1 | -1>> = {
  updated: { updatedAt: -1 },
  created: { createdAt: -1 },
  title: { title: 1 },
  due: { "srs.dueAt": 1 },
  mastery: { "srs.interval": 1, "srs.reviewCount": 1 },
}

const MASTERY_FILTERS: Record<string, Record<string, unknown>> = {
  new: { "srs.reviewCount": 0 },
  learning: { "srs.reviewCount": { $gt: 0 }, "srs.interval": { $lt: 7 } },
  familiar: { "srs.reviewCount": { $gt: 0 }, "srs.interval": { $gte: 7, $lt: 21 } },
  mastered: { "srs.reviewCount": { $gt: 0 }, "srs.interval": { $gte: 21 } },
}

export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams
  const filter: Record<string, unknown> = {}

  const skillId = p.get("skillId")
  if (skillId) filter.skillId = toObjectId(skillId)
  const q = p.get("q")?.trim()
  if (q) {
    const rx = new RegExp(escapeRegex(q.slice(0, 100)), "i")
    filter.$or = [{ title: rx }, { tags: rx }, { summary: rx }, { contentText: rx }]
  }
  const tag = p.get("tag")
  if (tag) filter.tags = normalizeTag(tag)
  if (p.get("important") === "1") filter.important = true
  if (p.get("due") === "1") filter["srs.dueAt"] = { $lte: new Date() }
  const mastery = p.get("mastery")
  if (mastery && MASTERY_FILTERS[mastery]) Object.assign(filter, MASTERY_FILTERS[mastery])

  const sortKey = p.get("sort") ?? "updated"
  const limit = Math.min(500, Math.max(1, Number(p.get("limit")) || 300))

  let query = Note.find(filter, LIST_PROJECTION)
    .sort(SORTS[sortKey] ?? SORTS.updated)
    .limit(limit)
  if (sortKey === "title") query = query.collation({ locale: "en", strength: 2 })
  const notes = await query.lean()
  return json(notes.map(noteSummaryDTO))
})

export const POST = route(async (req) => {
  const input = await readJson(req, noteCreateSchema)
  const skillId = toObjectId(input.skillId)
  if (!(await Skill.exists({ _id: skillId }))) throw new HttpError(400, "Choose a skill for this note.")
  const note = await Note.create({
    ...input,
    skillId,
    ...derivedFields(input.content),
    flashcards: mergeFlashcards(input.flashcards),
    srs: freshSrs(),
  })
  return json(noteDTO(note.toObject()), { status: 201 })
})
