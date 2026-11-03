"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { useTheme } from "next-themes"
import {
  BookOpen,
  Brain,
  FileText,
  Keyboard,
  Layers,
  LayoutDashboard,
  Monitor,
  Moon,
  Plus,
  Repeat,
  Search,
  Settings,
  Sun,
  Zap,
} from "lucide-react"
import { searchApi, useNotes, useSkills } from "@/lib/client/api"
import { useDebounced } from "@/lib/client/hooks"
import type { SearchResponse } from "@/lib/types"
import { SkillDot, SkillIcon } from "@/components/skills/skill-visuals"
import { Kbd } from "@/components/ui/primitives"

interface Action {
  id: string
  label: string
  icon: ReactNode
  keywords?: string
  shortcut?: string
  run: () => void
}

const itemClass =
  "group flex h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-sm text-fg-2 outline-none data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg [&_svg]:size-4 [&_svg]:shrink-0"
const groupClass =
  "px-1.5 pb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-3"

export function CommandPalette({
  open,
  onOpenChange,
  onNewSkill,
  onShortcuts,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNewSkill: () => void
  onShortcuts: () => void
}) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const debounced = useDebounced(query.trim(), 160)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const { data: skills = [] } = useSkills()
  const { data: recent = [] } = useNotes({ sort: "updated", limit: 6 }, open)

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  useEffect(() => {
    if (!debounced) {
      setResults(null)
      return
    }
    let cancelled = false
    setSearching(true)
    searchApi(debounced)
      .then((r) => !cancelled && setResults(r))
      .catch(() => !cancelled && setResults({ notes: [], skills: [] }))
      .finally(() => !cancelled && setSearching(false))
    return () => {
      cancelled = true
    }
  }, [debounced])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }
  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  const actions: Action[] = useMemo(
    () => [
      { id: "new-note", label: "New note", icon: <Plus />, keywords: "create write add", shortcut: "N", run: () => go("/notes/new") },
      { id: "new-skill", label: "New skill", icon: <Layers />, keywords: "create add category", run: () => run(onNewSkill) },
      { id: "revise", label: "Start revision session", icon: <Repeat />, keywords: "review study due", shortcut: "R", run: () => go("/revise/session") },
      { id: "cards", label: "Study flashcards", icon: <Zap />, keywords: "quiz recall cards", run: () => go("/revise/flashcards") },
      { id: "dash", label: "Go to dashboard", icon: <LayoutDashboard />, keywords: "home progress stats", run: () => go("/") },
      { id: "skills", label: "Go to skills", icon: <Layers />, run: () => go("/skills") },
      { id: "notes", label: "Go to all notes", icon: <BookOpen />, run: () => go("/notes") },
      { id: "settings", label: "Settings & backup", icon: <Settings />, keywords: "export import backup", run: () => go("/settings") },
      { id: "light", label: "Theme: Light", icon: <Sun />, keywords: "appearance", run: () => run(() => setTheme("light")) },
      { id: "dark", label: "Theme: Dark", icon: <Moon />, keywords: "appearance", run: () => run(() => setTheme("dark")) },
      { id: "system", label: "Theme: System", icon: <Monitor />, keywords: "appearance auto", run: () => run(() => setTheme("system")) },
      { id: "keys", label: "Keyboard shortcuts", icon: <Keyboard />, keywords: "help hotkeys", shortcut: "?", run: () => run(onShortcuts) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onNewSkill, onShortcuts, setTheme],
  )

  const q = query.trim().toLowerCase()
  const visibleActions = q ? actions.filter((a) => `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q)) : actions.slice(0, 5)
  const skillById = new Map(skills.map((s) => [s.id, s]))
  const visibleSkills = q ? skills.filter((s) => s.name.toLowerCase().includes(q)) : []
  const noteHits = q ? (results?.notes ?? []) : []
  const nothing = q && !searching && results && !visibleActions.length && !visibleSkills.length && !noteHits.length

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter={false}
      loop
      overlayClassName="anim-overlay fixed inset-0 z-50 bg-[rgb(6_8_16/0.5)] backdrop-blur-[3px]"
      contentClassName="anim-dialog fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-[18px] shrink-0 text-fg-3" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search notes, skills, commands…"
          className="h-14 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3"
        />
        {searching ? (
          <span className="size-4 animate-spin rounded-full border-2 border-fg-3/30 border-t-primary" />
        ) : (
          <Kbd>Esc</Kbd>
        )}
      </div>
      <Command.List className="max-h-[min(460px,60vh)] overflow-y-auto overscroll-contain pb-2">
        {nothing && (
          <div className="px-6 py-10 text-center text-sm text-fg-3">
            No results for “{query.trim()}”. Try a command name, tag or keyword.
          </div>
        )}

        {noteHits.length > 0 && (
          <Command.Group heading="Notes" className={groupClass}>
            {noteHits.map((n) => {
              const skill = skillById.get(n.skillId)
              return (
                <Command.Item key={n.id} value={`note-${n.id}`} onSelect={() => go(`/notes/${n.id}`)} className={`${itemClass} h-auto py-2.5`}>
                  <FileText className="text-fg-3" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-fg">{n.title}</span>
                      {skill && <SkillDot color={skill.color} className="size-1.5 ring-0" />}
                      {skill && <span className="shrink-0 truncate text-xs text-fg-3">{skill.name}</span>}
                    </div>
                    {n.context && <div className="mt-0.5 line-clamp-1 text-xs text-fg-3">{n.context}</div>}
                  </div>
                </Command.Item>
              )
            })}
          </Command.Group>
        )}

        {visibleSkills.length > 0 && (
          <Command.Group heading="Skills" className={groupClass}>
            {visibleSkills.map((s) => (
              <Command.Item key={s.id} value={`skill-${s.id}`} onSelect={() => go(`/skills/${s.id}`)} className={itemClass}>
                <SkillIcon icon={s.icon} color={s.color} size="xs" />
                <span className="flex-1 truncate text-fg">{s.name}</span>
                <span className="text-xs text-fg-3">{s.stats.notes} notes</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {!q && recent.length > 0 && (
          <Command.Group heading="Recently edited" className={groupClass}>
            {recent.map((n) => {
              const skill = skillById.get(n.skillId)
              return (
                <Command.Item key={n.id} value={`recent-${n.id}`} onSelect={() => go(`/notes/${n.id}`)} className={itemClass}>
                  <FileText className="text-fg-3" />
                  <span className="flex-1 truncate text-fg">{n.title}</span>
                  {skill && (
                    <span className="flex items-center gap-1.5 text-xs text-fg-3">
                      <SkillDot color={skill.color} className="size-1.5 ring-0" />
                      {skill.name}
                    </span>
                  )}
                </Command.Item>
              )
            })}
          </Command.Group>
        )}

        {visibleActions.length > 0 && (
          <Command.Group heading={q ? "Actions" : "Quick actions"} className={groupClass}>
            {visibleActions.map((a) => (
              <Command.Item key={a.id} value={a.id} onSelect={a.run} className={itemClass}>
                <span className="text-fg-3 group-data-[selected=true]:text-primary-ink">{a.icon}</span>
                <span className="flex-1">{a.label}</span>
                {a.shortcut && <Kbd>{a.shortcut}</Kbd>}
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
      <div className="flex items-center gap-4 border-t border-border bg-surface-2/60 px-4 py-2 text-[11px] text-fg-3">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Brain className="size-3.5" /> Searches titles, tags, takeaways and note content
        </span>
      </div>
    </Command.Dialog>
  )
}
