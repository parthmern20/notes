import mongoose from "mongoose"
import { json, readJson, route } from "@/lib/server/http"
import { Note, Review, Skill } from "@/lib/server/models"
import { backupSchema } from "@/lib/server/validators"
import type { BackupFile } from "@/lib/types"

export const GET = route(async () => {
  const [skills, notes, reviews] = await Promise.all([Skill.find().lean(), Note.find().lean(), Review.find().lean()])
  const file: BackupFile = {
    app: "mnemo",
    version: 1,
    exportedAt: new Date().toISOString(),
    skills: skills as unknown as Record<string, unknown>[],
    notes: notes as unknown as Record<string, unknown>[],
    reviews: reviews as unknown as Record<string, unknown>[],
  }
  const date = file.exportedAt.slice(0, 10)
  return new Response(JSON.stringify(file), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="mnemo-backup-${date}.json"`,
    },
  })
})

const toId = (v: unknown) => (typeof v === "string" && /^[a-f0-9]{24}$/i.test(v) ? new mongoose.Types.ObjectId(v) : null)

// Upserts by _id so restoring the same backup twice is harmless; mongoose casts ids and dates per schema.
function upserts(docs: Record<string, unknown>[]) {
  return docs.flatMap((doc) => {
    const _id = toId(doc._id)
    return _id ? [{ replaceOne: { filter: { _id }, replacement: { ...doc, _id }, upsert: true } }] : []
  })
}

export const POST = route(async (req) => {
  const data = await readJson(req, backupSchema, 200 * 1024 * 1024)
  const options = { timestamps: false, ordered: false }
  const [skills, notes, reviews] = [upserts(data.skills), upserts(data.notes), upserts(data.reviews)]
  if (skills.length) await Skill.bulkWrite(skills as never, options)
  if (notes.length) await Note.bulkWrite(notes as never, options)
  if (reviews.length) await Review.bulkWrite(reviews as never, options)
  return json({ skills: skills.length, notes: notes.length, reviews: reviews.length })
})
