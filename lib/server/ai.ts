import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"
import { HttpError } from "./http"

export const AI_MODEL = "claude-opus-5-5"

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY)

let client: Anthropic | null = null
const getClient = () => (client ??= new Anthropic())

const SYSTEM = `You help a learner revise their own study notes. Notes are grouped by skill and arrive as Markdown: fenced code blocks are code snippets, and bash/powershell/bat fences hold terminal commands.
Work only from what the note says — don't add facts it doesn't contain. Keep the learner's terminology, and reproduce commands, flags and code exactly.`

const takeawaysSchema = z.object({
  takeaways: z.array(z.string()),
})

const flashcardsSchema = z.object({
  flashcards: z.array(z.object({ question: z.string(), answer: z.string() })),
})

async function generate<S extends z.ZodType>(schema: S, instruction: string, title: string, markdown: string): Promise<z.infer<S>> {
  if (!aiConfigured()) throw new HttpError(501, "Add ANTHROPIC_API_KEY to your .env file to enable AI generation.")
  try {
    const response = await getClient().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
      system: SYSTEM,
      messages: [{ role: "user", content: `${instruction}\n\nNote title: ${title || "Untitled"}\n\n<note>\n${markdown}\n</note>` }],
    })
    if (response.stop_reason === "refusal") {
      throw new HttpError(422, "Claude declined to process this note. Try editing it and generating again.")
    }
    if (!response.parsed_output) {
      throw new HttpError(502, "The AI response was incomplete. Please try again.")
    }
    return response.parsed_output as z.infer<S>
  } catch (err) {
    if (err instanceof HttpError) throw err
    if (err instanceof Anthropic.AuthenticationError) throw new HttpError(502, "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY.")
    if (err instanceof Anthropic.PermissionDeniedError) throw new HttpError(502, "This API key doesn't have access to the model.")
    if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "The AI service is busy. Try again in a minute.")
    if (err instanceof Anthropic.BadRequestError) throw new HttpError(400, `The AI request was rejected: ${err.message}`)
    if (err instanceof Anthropic.APIConnectionError) throw new HttpError(503, "Couldn't reach the AI service. Check your connection.")
    if (err instanceof Anthropic.APIError) throw new HttpError(502, `The AI service returned an error (${err.status}). Please try again.`)
    throw err
  }
}

export async function generateTakeaways(title: string, markdown: string): Promise<string[]> {
  const { takeaways } = await generate(
    takeawaysSchema,
    "Distil this note into 3–7 key takeaways for quick revision. Each takeaway should stand on its own, so that reading it alone brings the idea back; a takeaway about a command should include the command.",
    title,
    markdown,
  )
  return takeaways.map((t) => t.trim()).filter(Boolean).slice(0, 10)
}

export async function generateFlashcards(title: string, markdown: string): Promise<{ question: string; answer: string }[]> {
  const { flashcards } = await generate(
    flashcardsSchema,
    "Write flashcards for active recall from this note, one fact, concept or command per card. A question should make the learner retrieve the answer rather than recognise it. Keep answers short and exact; when the answer is a command or code, give it inside backticks. Write as many cards as the note supports (usually 4–12) and skip trivia.",
    title,
    markdown,
  )
  return flashcards
    .map((c) => ({ question: c.question.trim().slice(0, 500), answer: c.answer.trim().slice(0, 3000) }))
    .filter((c) => c.question && c.answer)
    .slice(0, 30)
}
