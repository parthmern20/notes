"use client"

import { useId, useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn, normalizeTag } from "@/lib/utils"

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags…",
  max = 20,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  max?: number
}) {
  const [draft, setDraft] = useState("")
  const listId = useId()

  const add = (raw: string) => {
    const tags = raw.split(/[,\n]/).map(normalizeTag).filter(Boolean)
    if (!tags.length) return
    onChange([...new Set([...value, ...tags])].slice(0, max))
    setDraft("")
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || (e.key === "Tab" && draft.trim())) {
      e.preventDefault()
      add(draft)
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-[10px] border border-border bg-surface px-2 py-1.5 shadow-soft transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-[var(--primary-soft)] hover:border-border-strong",
      )}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-6 items-center gap-1 rounded-md bg-primary-soft pl-2 pr-1 text-xs font-medium text-primary-ink">
          #{tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="grid size-4 place-items-center rounded hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        list={listId}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={value.length ? "" : placeholder}
        className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-3"
        aria-label="Add tag"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .slice(0, 30)
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  )
}
