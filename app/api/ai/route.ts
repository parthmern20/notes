import { generateFlashcards, generateTakeaways } from "@/lib/server/ai"
import { json, readJson, route } from "@/lib/server/http"
import { aiSchema } from "@/lib/server/validators"

export const maxDuration = 120

export const POST = route(
  async (req) => {
    const { task, title, markdown } = await readJson(req, aiSchema)
    if (task === "takeaways") return json({ takeaways: await generateTakeaways(title, markdown) })
    return json({ flashcards: await generateFlashcards(title, markdown) })
  },
  { db: false },
)
