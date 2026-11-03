import mongoose, { Schema, type Model, type Types } from "mongoose"
import type { DocNode } from "@/lib/doc"
import type { Difficulty } from "@/lib/types"
import { DEFAULT_EASE } from "@/lib/srs"

export interface SrsFields {
  ease: number
  interval: number
  repetitions: number
  reviewCount: number
  lapses: number
  dueAt: Date
  lastReviewedAt: Date | null
  lastRating: number | null
}

export interface SkillDoc {
  _id: Types.ObjectId
  name: string
  description: string
  color: string
  icon: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface FlashcardDoc {
  _id: Types.ObjectId
  question: string
  answer: string
  srs: SrsFields
}

export interface NoteDoc {
  _id: Types.ObjectId
  skillId: Types.ObjectId
  title: string
  content: DocNode
  contentText: string
  summary: string
  tags: string[]
  difficulty: Difficulty
  important: boolean
  source: string
  flashcards: FlashcardDoc[]
  stats: { words: number; readingMinutes: number; codeBlocks: number; commands: number }
  srs: SrsFields
  createdAt: Date
  updatedAt: Date
}

export interface ReviewDoc {
  _id: Types.ObjectId
  noteId: Types.ObjectId
  skillId: Types.ObjectId
  cardId: Types.ObjectId | null
  kind: "note" | "card"
  rating: number
  durationMs: number
  intervalBefore: number
  intervalAfter: number
  reviewedAt: Date
}

const srsSchema = new Schema<SrsFields>(
  {
    ease: { type: Number, default: DEFAULT_EASE },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    dueAt: { type: Date, default: () => new Date() },
    lastReviewedAt: { type: Date, default: null },
    lastRating: { type: Number, default: null },
  },
  { _id: false },
)

const skillSchema = new Schema<SkillDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: "", trim: true, maxlength: 280 },
    color: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const flashcardSchema = new Schema<FlashcardDoc>({
  question: { type: String, required: true, trim: true, maxlength: 500 },
  answer: { type: String, required: true, trim: true, maxlength: 3000 },
  srs: { type: srsSchema, default: () => ({}) },
})

const noteSchema = new Schema<NoteDoc>(
  {
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: Schema.Types.Mixed, required: true },
    contentText: { type: String, default: "" },
    summary: { type: String, default: "", maxlength: 4000 },
    tags: { type: [String], default: [], index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    important: { type: Boolean, default: false },
    source: { type: String, default: "", maxlength: 500 },
    flashcards: { type: [flashcardSchema], default: [] },
    stats: {
      words: { type: Number, default: 0 },
      readingMinutes: { type: Number, default: 1 },
      codeBlocks: { type: Number, default: 0 },
      commands: { type: Number, default: 0 },
    },
    srs: { type: srsSchema, default: () => ({}) },
  },
  { timestamps: true, minimize: false },
)
noteSchema.index({ "srs.dueAt": 1 })
noteSchema.index({ skillId: 1, updatedAt: -1 })

const reviewSchema = new Schema<ReviewDoc>(
  {
    noteId: { type: Schema.Types.ObjectId, required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, required: true },
    cardId: { type: Schema.Types.ObjectId, default: null },
    kind: { type: String, enum: ["note", "card"], required: true },
    rating: { type: Number, required: true, min: 1, max: 4 },
    durationMs: { type: Number, default: 0 },
    intervalBefore: { type: Number, default: 0 },
    intervalAfter: { type: Number, default: 0 },
    reviewedAt: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false },
)

export const Skill = (mongoose.models.Skill as Model<SkillDoc>) ?? mongoose.model<SkillDoc>("Skill", skillSchema)
export const Note = (mongoose.models.Note as Model<NoteDoc>) ?? mongoose.model<NoteDoc>("Note", noteSchema)
export const Review = (mongoose.models.Review as Model<ReviewDoc>) ?? mongoose.model<ReviewDoc>("Review", reviewSchema)
