import { z } from "zod"
import type { DocNode } from "@/lib/doc"
import { SKILL_COLORS, SKILL_ICON_KEYS, type SkillColor } from "@/lib/skill-meta"
import { normalizeTag } from "@/lib/utils"

const objectIdString = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")

const docSchema = z.custom<DocNode>(
  (v) => !!v && typeof v === "object" && (v as DocNode).type === "doc" && Array.isArray((v as DocNode).content),
  "Content must be a rich-text document",
)

const tagsSchema = z
  .array(z.string().max(64))
  .max(40)
  .transform((tags) => [...new Set(tags.map(normalizeTag).filter(Boolean))].slice(0, 20))

const flashcardsSchema = z
  .array(
    z.object({
      id: z.string().max(64).optional(),
      question: z.string().trim().min(1, "Every flashcard needs a question").max(500),
      answer: z.string().trim().min(1, "Every flashcard needs an answer").max(3000),
    }),
  )
  .max(200)

const noteFields = {
  skillId: objectIdString,
  title: z.string().trim().min(1, "Give your note a title").max(160),
  content: docSchema,
  summary: z.string().max(4000),
  tags: tagsSchema,
  difficulty: z.enum(["easy", "medium", "hard"]),
  important: z.boolean(),
  source: z.string().trim().max(500),
  flashcards: flashcardsSchema,
}

export const noteCreateSchema = z.object({
  ...noteFields,
  summary: noteFields.summary.default(""),
  tags: noteFields.tags.default([]),
  difficulty: noteFields.difficulty.default("medium"),
  important: noteFields.important.default(false),
  source: noteFields.source.default(""),
  flashcards: noteFields.flashcards.default([]),
})

// No defaults here: a PATCH must only touch the fields it sends.
export const noteUpdateSchema = z.object({
  skillId: noteFields.skillId.optional(),
  title: noteFields.title.optional(),
  content: noteFields.content.optional(),
  summary: noteFields.summary.optional(),
  tags: noteFields.tags.optional(),
  difficulty: noteFields.difficulty.optional(),
  important: noteFields.important.optional(),
  source: noteFields.source.optional(),
  flashcards: noteFields.flashcards.optional(),
})

const colorEnum = z.enum(Object.keys(SKILL_COLORS) as [SkillColor, ...SkillColor[]])
const iconEnum = z.enum(SKILL_ICON_KEYS)

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1, "Name your skill").max(60),
  description: z.string().trim().max(280).default(""),
  color: colorEnum,
  icon: iconEnum,
})

export const skillUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name your skill").max(60).optional(),
  description: z.string().trim().max(280).optional(),
  color: colorEnum.optional(),
  icon: iconEnum.optional(),
})

export const reviewSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  durationMs: z.number().int().min(0).max(3_600_000).default(0),
})

export const aiSchema = z.object({
  task: z.enum(["takeaways", "flashcards"]),
  title: z.string().max(160).default(""),
  markdown: z.string().trim().min(20, "Write a bit more before generating").max(120_000),
})

export const backupSchema = z.object({
  app: z.literal("mnemo"),
  version: z.literal(1),
  skills: z.array(z.record(z.string(), z.unknown())).max(5_000),
  notes: z.array(z.record(z.string(), z.unknown())).max(50_000),
  reviews: z.array(z.record(z.string(), z.unknown())).max(500_000).default([]),
})
