import { HttpError, json, readJson, route, toObjectId, type IdContext } from "@/lib/server/http"
import { Note, Skill } from "@/lib/server/models"
import { computeSkillStats, skillDTO } from "@/lib/server/serialize"
import { skillUpdateSchema } from "@/lib/server/validators"
import { escapeRegex } from "@/lib/utils"

export const GET = route(async (_req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const skill = await Skill.findById(_id).lean()
  if (!skill) throw new HttpError(404, "Skill not found")
  const notes = await Note.find({ skillId: _id }, { skillId: 1, srs: 1, updatedAt: 1, "flashcards.srs.dueAt": 1 }).lean()
  return json(skillDTO(skill, computeSkillStats(notes).get(id)))
})

export const PATCH = route(async (req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const input = await readJson(req, skillUpdateSchema)
  if (input.name) {
    const duplicate = await Skill.exists({ _id: { $ne: _id }, name: new RegExp(`^${escapeRegex(input.name)}$`, "i") })
    if (duplicate) throw new HttpError(409, `You already have a skill named “${input.name}”.`)
  }
  const skill = await Skill.findByIdAndUpdate(_id, { $set: input }, { returnDocument: "after", runValidators: true }).lean()
  if (!skill) throw new HttpError(404, "Skill not found")
  const notes = await Note.find({ skillId: _id }, { skillId: 1, srs: 1, updatedAt: 1, "flashcards.srs.dueAt": 1 }).lean()
  return json(skillDTO(skill, computeSkillStats(notes).get(id)))
})

// Deleting a skill removes its notes; review history is kept so streaks and activity stay intact.
export const DELETE = route(async (_req, { params }: IdContext) => {
  const { id } = await params
  const _id = toObjectId(id)
  const skill = await Skill.findByIdAndDelete(_id).lean()
  if (!skill) throw new HttpError(404, "Skill not found")
  const { deletedCount } = await Note.deleteMany({ skillId: _id })
  return json({ deleted: true, notes: deletedCount })
})
