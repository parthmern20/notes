import mongoose from "mongoose"
import { docStats, docToText, type DocNode } from "@/lib/doc"
import { DEFAULT_EASE } from "@/lib/srs"
import type { FlashcardInput } from "@/lib/types"
import type { FlashcardDoc, SrsFields } from "./models"

export function freshSrs(now = new Date()): SrsFields {
  return { ease: DEFAULT_EASE, interval: 0, repetitions: 0, reviewCount: 0, lapses: 0, dueAt: now, lastReviewedAt: null, lastRating: null }
}

/** Fields derived from the document on every save: search text and content stats. */
export function derivedFields(content: DocNode) {
  const contentText = docToText(content)
  return { contentText, stats: docStats(content, contentText) }
}

/** Keeps each existing card's review history when the editor sends the card list back. */
export function mergeFlashcards(incoming: FlashcardInput[], existing: Pick<FlashcardDoc, "_id" | "srs">[] = []) {
  const byId = new Map(existing.map((c) => [String(c._id), c]))
  return incoming.map(({ id, question, answer }) => {
    const prev = id ? byId.get(id) : undefined
    return prev
      ? { _id: prev._id, question, answer, srs: prev.srs ?? freshSrs() }
      : { _id: new mongoose.Types.ObjectId(), question, answer, srs: freshSrs() }
  })
}

export const LIST_PROJECTION = {
  content: 0,
  "flashcards.question": 0,
  "flashcards.answer": 0,
  "flashcards.srs": 0,
} as const
