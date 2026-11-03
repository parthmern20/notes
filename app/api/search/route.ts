import { matchContext, excerptOf } from "@/lib/doc"
import { json, route } from "@/lib/server/http"
import { Note, Skill } from "@/lib/server/models"
import type { SearchResponse } from "@/lib/types"
import { escapeRegex } from "@/lib/utils"

export const GET = route(async (req) => {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) ?? ""
  if (!q) return json<SearchResponse>({ notes: [], skills: [] })
  const rx = new RegExp(escapeRegex(q), "i")

  const [notes, skills] = await Promise.all([
    Note.find(
      { $or: [{ title: rx }, { tags: rx }, { summary: rx }, { contentText: rx }] },
      { title: 1, skillId: 1, tags: 1, contentText: 1, summary: 1 },
    )
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
    Skill.find({ $or: [{ name: rx }, { description: rx }] }).limit(5).lean(),
  ])

  const body: SearchResponse = {
    notes: notes.map((n) => {
      const text = n.contentText ?? ""
      const inBody = rx.test(text)
      return {
        id: String(n._id),
        title: n.title,
        skillId: String(n.skillId),
        tags: n.tags ?? [],
        context: inBody ? matchContext(text, q) : rx.test(n.summary ?? "") ? matchContext(n.summary, q) : excerptOf(text, 120),
      }
    }),
    skills: skills.map((s) => ({ id: String(s._id), name: s.name, color: s.color, icon: s.icon })),
  }
  return json(body)
})
