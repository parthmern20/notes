import { AI_MODEL, aiConfigured } from "@/lib/server/ai"
import type { MetaDTO } from "@/lib/types"

function databaseName(): string | null {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB
  const match = process.env.MONGODB_URI?.match(/\/([^/?]+)(\?|$)/)
  return match?.[1] ?? null
}

export function GET() {
  const ai = aiConfigured()
  const body: MetaDTO = { ai, aiModel: ai ? AI_MODEL : null, database: databaseName() }
  return Response.json(body)
}
