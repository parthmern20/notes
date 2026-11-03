import type { PipelineStage, Types } from "mongoose"
import { json, route, toObjectId } from "@/lib/server/http"
import { Note, type FlashcardDoc } from "@/lib/server/models"
import { flashcardDTO } from "@/lib/server/serialize"
import type { CardQueueItem } from "@/lib/types"

interface Row {
  _id: Types.ObjectId
  title: string
  skillId: Types.ObjectId
  flashcards: FlashcardDoc
}

// Flashcards to study, flattened across notes. Modes: due (default) or all.
export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams
  const skillId = p.get("skillId")
  const noteId = p.get("noteId")
  const match: Record<string, unknown> = {}
  if (skillId) match.skillId = toObjectId(skillId)
  if (noteId) match._id = toObjectId(noteId)
  const limit = Math.min(500, Math.max(1, Number(p.get("limit")) || 200))

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $project: { title: 1, skillId: 1, flashcards: 1 } },
    { $unwind: "$flashcards" },
  ]
  if (p.get("mode") !== "all") pipeline.push({ $match: { "flashcards.srs.dueAt": { $lte: new Date() } } })
  pipeline.push({ $sort: { "flashcards.srs.dueAt": 1 } }, { $limit: limit })

  const rows = await Note.aggregate<Row>(pipeline)
  const items: CardQueueItem[] = rows.map((r) => ({
    noteId: String(r._id),
    noteTitle: r.title,
    skillId: String(r.skillId),
    card: flashcardDTO(r.flashcards),
  }))
  return json(items)
})
