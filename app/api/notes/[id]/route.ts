import { HttpError, json, readJson, route, toObjectId, type IdContext } from "@/lib/server/http"
import { Note, Skill } from "@/lib/server/models"
import { derivedFields, mergeFlashcards } from "@/lib/server/notes"
import { noteDTO } from "@/lib/server/serialize"
import { noteUpdateSchema } from "@/lib/server/validators"
import type { NoteResponse } from "@/lib/types"

export const GET = route(async (_req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const note = await Note.findById(_id).lean()
  if (!note) throw new HttpError(404, "Note not found")
  const [prev, next] = await Promise.all([
    Note.findOne({ skillId: note.skillId, createdAt: { $lt: note.createdAt } }).sort({ createdAt: -1 }).select("title").lean(),
    Note.findOne({ skillId: note.skillId, createdAt: { $gt: note.createdAt } }).sort({ createdAt: 1 }).select("title").lean(),
  ])
  const body: NoteResponse = {
    note: noteDTO(note),
    prev: prev ? { id: String(prev._id), title: prev.title } : null,
    next: next ? { id: String(next._id), title: next.title } : null,
  }
  return json(body)
})

export const PATCH = route(async (req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const input = await readJson(req, noteUpdateSchema)
  const existing = await Note.findById(_id, { "flashcards._id": 1, "flashcards.srs": 1 }).lean()
  if (!existing) throw new HttpError(404, "Note not found")

  const { flashcards, content, skillId, ...rest } = input
  const update: Record<string, unknown> = { ...rest }
  if (skillId) {
    const sid = toObjectId(skillId)
    if (!(await Skill.exists({ _id: sid }))) throw new HttpError(400, "That skill no longer exists.")
    update.skillId = sid
  }
  if (content) Object.assign(update, { content, ...derivedFields(content) })
  if (flashcards) update.flashcards = mergeFlashcards(flashcards, existing.flashcards)

  const note = await Note.findByIdAndUpdate(_id, { $set: update }, { returnDocument: "after", runValidators: true }).lean()
  if (!note) throw new HttpError(404, "Note not found")
  return json(noteDTO(note))
})

export const DELETE = route(async (_req, { params }: IdContext) => {
  const { id } = await params
  const deleted = await Note.findByIdAndDelete(toObjectId(id)).lean()
  if (!deleted) throw new HttpError(404, "Note not found")
  return json({ deleted: true })
})
