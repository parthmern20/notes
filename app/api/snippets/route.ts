import { extractSnippets } from "@/lib/doc"
import { json, route, toObjectId } from "@/lib/server/http"
import { Note } from "@/lib/server/models"
import type { SnippetDTO } from "@/lib/types"

// Every code block and terminal command in a skill — the data behind the cheat sheet.
export const GET = route(async (req) => {
  const skillId = new URL(req.url).searchParams.get("skillId")
  const filter = skillId ? { skillId: toObjectId(skillId) } : {}
  const notes = await Note.find(filter, { title: 1, content: 1 }).sort({ createdAt: 1 }).limit(500).lean()
  const snippets: SnippetDTO[] = notes.flatMap((n) =>
    extractSnippets(n.content).map((s) => ({ noteId: String(n._id), noteTitle: n.title, ...s })),
  )
  return json(snippets)
})
