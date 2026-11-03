import { json, route, toObjectId } from "@/lib/server/http"
import { Note } from "@/lib/server/models"
import { LIST_PROJECTION } from "@/lib/server/notes"
import { noteSummaryDTO } from "@/lib/server/serialize"

// Notes to revise, most urgent first. Modes: due (default), all, weak, important.
export const GET = route(async (req) => {
  const p = new URL(req.url).searchParams
  const filter: Record<string, unknown> = {}
  const skillId = p.get("skillId")
  if (skillId) filter.skillId = toObjectId(skillId)

  let sort: Record<string, 1 | -1> = { "srs.dueAt": 1 }
  switch (p.get("mode")) {
    case "all":
      break
    case "weak":
      filter["srs.reviewCount"] = { $gt: 0 }
      filter.$or = [{ "srs.lapses": { $gt: 0 } }, { "srs.interval": { $lt: 7 } }, { "srs.lastRating": { $lte: 2 } }]
      sort = { "srs.interval": 1, "srs.lapses": -1 }
      break
    case "important":
      filter.important = true
      break
    default:
      filter["srs.dueAt"] = { $lte: new Date() }
  }

  const limit = Math.min(200, Math.max(1, Number(p.get("limit")) || 50))
  const notes = await Note.find(filter, LIST_PROJECTION).sort(sort).limit(limit).lean()
  return json(notes.map(noteSummaryDTO))
})
