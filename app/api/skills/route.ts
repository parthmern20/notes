import { HttpError, json, readJson, route } from "@/lib/server/http"
import { Note, Skill } from "@/lib/server/models"
import { computeSkillStats, skillDTO } from "@/lib/server/serialize"
import { skillCreateSchema } from "@/lib/server/validators"
import { escapeRegex } from "@/lib/utils"

export const GET = route(async () => {
  const [skills, notes] = await Promise.all([
    Skill.find().sort({ order: 1, createdAt: 1 }).lean(),
    Note.find({}, { skillId: 1, srs: 1, updatedAt: 1, "flashcards.srs.dueAt": 1 }).lean(),
  ])
  const stats = computeSkillStats(notes)
  return json(skills.map((s) => skillDTO(s, stats.get(String(s._id)))))
})

export const POST = route(async (req) => {
  const input = await readJson(req, skillCreateSchema)
  const duplicate = await Skill.exists({ name: new RegExp(`^${escapeRegex(input.name)}$`, "i") })
  if (duplicate) throw new HttpError(409, `You already have a skill named “${input.name}”.`)
  const last = await Skill.findOne().sort({ order: -1 }).select("order").lean()
  const skill = await Skill.create({ ...input, order: (last?.order ?? 0) + 1 })
  return json(skillDTO(skill.toObject()), { status: 201 })
})
