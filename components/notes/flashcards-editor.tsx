"use client"

import { AnimatePresence, motion } from "motion/react"
import { Plus, Sparkles, Trash, Zap } from "lucide-react"
import type { FlashcardInput } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, Textarea } from "@/components/ui/primitives"

export interface EditableCard extends FlashcardInput {
  key: string
}

let seq = 0
export const newCardKey = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`

export function FlashcardsEditor({
  cards,
  onChange,
  onGenerate,
  generating,
  aiEnabled,
}: {
  cards: EditableCard[]
  onChange: (cards: EditableCard[]) => void
  onGenerate: () => void
  generating: boolean
  aiEnabled: boolean
}) {
  const update = (key: string, patch: Partial<FlashcardInput>) => onChange(cards.map((c) => (c.key === key ? { ...c, ...patch } : c)))

  return (
    <Card>
      <CardHeader
        icon={<Zap />}
        title={
          <span className="flex items-center gap-2">
            Flashcards
            {cards.length > 0 && <span className="rounded-full bg-surface-2 px-2 text-xs font-medium text-fg-3">{cards.length}</span>}
          </span>
        }
        description="Question → answer pairs for active recall. Wrap commands in `backticks`."
        action={
          aiEnabled && (
            <Button size="sm" variant="soft" onClick={onGenerate} loading={generating}>
              {!generating && <Sparkles />} Generate with AI
            </Button>
          )
        }
      />
      <div className="grid gap-3 p-5">
        <AnimatePresence initial={false}>
          {cards.map((card, i) => (
            <motion.div
              key={card.key}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
              className="group grid gap-2 rounded-xl border border-border bg-surface-2/50 p-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-start"
            >
              <span className="hidden size-7 place-items-center rounded-lg bg-surface text-xs font-semibold text-fg-3 sm:grid">{i + 1}</span>
              <Textarea
                value={card.question}
                onChange={(e) => update(card.key, { question: e.target.value })}
                placeholder="Question — e.g. How do you list running containers?"
                aria-label={`Question ${i + 1}`}
                rows={2}
                maxLength={500}
                className="min-h-16 bg-surface"
              />
              <Textarea
                value={card.answer}
                onChange={(e) => update(card.key, { answer: e.target.value })}
                placeholder="Answer — e.g. `docker ps`"
                aria-label={`Answer ${i + 1}`}
                rows={2}
                maxLength={3000}
                className="min-h-16 bg-surface font-[450]"
              />
              <Button
                size="icon-sm"
                variant="danger-ghost"
                aria-label={`Delete flashcard ${i + 1}`}
                onClick={() => onChange(cards.filter((c) => c.key !== card.key))}
                className="justify-self-end sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Trash />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => onChange([...cards, { key: newCardKey(), question: "", answer: "" }])}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong py-3 text-sm font-medium text-fg-3 transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-ink"
        >
          <Plus className="size-4" /> Add flashcard
        </button>
      </div>
    </Card>
  )
}
