"use client"

import { useState } from "react"
import { Eye, ListChecks } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { CardText } from "./revision-kit"

export function takeawayLines(summary: string): string[] {
  return summary
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
}

/** Key takeaways panel; in recall mode they start hidden so you can test yourself first. */
export function Takeaways({ summary, hidden = false, className }: { summary: string; hidden?: boolean; className?: string }) {
  const [revealed, setRevealed] = useState(!hidden)
  const lines = takeawayLines(summary)
  if (!lines.length) return null
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--primary)_28%,var(--border))] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_7%,var(--surface)),var(--surface)_60%)] p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-primary-ink">
        <ListChecks className="size-4" /> Key takeaways
      </div>
      <ol className={cn("grid gap-2.5 transition-[filter] duration-300", !revealed && "select-none blur-[6px]")}>
        {lines.map((line, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 text-[15px] leading-relaxed"
          >
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-ink">
              {i + 1}
            </span>
            <span className="min-w-0">
              <CardText text={line} />
            </span>
          </motion.li>
        ))}
      </ol>
      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--surface)_25%,transparent)] text-sm font-medium text-fg"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-card">
            <Eye className="size-4" /> Recall first, then reveal takeaways
          </span>
        </button>
      )}
    </div>
  )
}
