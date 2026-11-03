"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Hash, LayoutGrid, Plus, Rows3, Search, Star, X } from "lucide-react"
import { useNotes, useSkills, type NotesQuery } from "@/lib/client/api"
import { useDebounced, useStoredState } from "@/lib/client/hooks"
import { MASTERY_LEVELS, MASTERY_META } from "@/lib/srs"
import type { MasteryLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Stagger, StaggerItem } from "@/components/motion/motion"
import { NoteCard } from "@/components/notes/note-card"
import { SkillIcon } from "@/components/skills/skill-visuals"
import { buttonVariants } from "@/components/ui/button"
import { Select, Tooltip } from "@/components/ui/overlays"
import { EmptyState, Input, PageHeader, Skeleton } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"
import { ErrorState } from "@/components/ui/states"

type Sort = NonNullable<NotesQuery["sort"]>

export function NotesView() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const dq = useDebounced(q.trim(), 250)
  const [skillId, setSkillId] = useState(params.get("skill") ?? "all")
  const [tag, setTag] = useState(params.get("tag") ?? "")
  const [mastery, setMastery] = useState<"all" | MasteryLevel>("all")
  const [important, setImportant] = useState(false)
  const [sort, setSort] = useState<Sort>("updated")
  const [layout, setLayout] = useStoredState<"grid" | "row">("mnemo:notes-layout", "grid")

  // Keep the tag filter in sync when arriving from a tag link.
  useEffect(() => setTag(params.get("tag") ?? ""), [params])

  const { data: skills } = useSkills()
  const { data: everything } = useNotes({ limit: 500 })
  const { data: notes, error, isValidating, mutate } = useNotes({
    q: dq || undefined,
    skillId: skillId === "all" ? undefined : skillId,
    tag: tag || undefined,
    mastery: mastery === "all" ? undefined : mastery,
    important,
    sort,
  })
  const skillMap = useMemo(() => new Map(skills?.map((s) => [s.id, s])), [skills])
  const popularTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of everything ?? []) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
  }, [everything])

  const filtered = Boolean(dq || skillId !== "all" || tag || mastery !== "all" || important)
  const clearTag = () => {
    setTag("")
    router.replace("/notes")
  }

  if (error && !notes) return <ErrorState error={error} onRetry={() => mutate()} title="Couldn't load notes" />

  return (
    <div className="grid gap-6">
      <PageHeader
        title="All notes"
        description={everything ? `${everything.length} notes across ${skills?.length ?? 0} skills` : "Every note you've written."}
        actions={
          <Link href="/notes/new" className={buttonVariants({ variant: "primary" })}>
            <Plus /> New note
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, content, commands…" className="pl-9" aria-label="Search notes" />
        </div>
        <Select
          size="sm"
          ariaLabel="Skill"
          value={skillId}
          onValueChange={setSkillId}
          options={[
            { value: "all", label: "All skills" },
            ...(skills ?? []).map((s) => ({ value: s.id, label: s.name, icon: <SkillIcon icon={s.icon} color={s.color} size="xs" className="size-5" /> })),
          ]}
        />
        <Select
          size="sm"
          ariaLabel="Mastery"
          value={mastery}
          onValueChange={setMastery}
          options={[{ value: "all", label: "Any mastery" }, ...MASTERY_LEVELS.map((l) => ({ value: l, label: MASTERY_META[l].label }))]}
        />
        <Tooltip content="Only important notes">
          <button
            type="button"
            aria-pressed={important}
            onClick={() => setImportant((v) => !v)}
            className={cn(
              "grid size-8 place-items-center rounded-lg border border-border bg-surface text-fg-3 shadow-soft transition-colors hover:text-fg",
              important && "border-[color-mix(in_oklab,#f5b53d_45%,var(--border))] bg-[color-mix(in_oklab,#f5b53d_12%,var(--surface))] text-[#d18a00]",
            )}
          >
            <Star className={cn("size-4", important && "fill-current")} />
          </button>
        </Tooltip>
        <Select
          size="sm"
          ariaLabel="Sort"
          value={sort}
          onValueChange={setSort}
          options={[
            { value: "updated", label: "Recently edited" },
            { value: "created", label: "Newest" },
            { value: "title", label: "Title A–Z" },
            { value: "due", label: "Due soonest" },
            { value: "mastery", label: "Weakest first" },
          ]}
        />
        <Segmented
          size="sm"
          className="ml-auto"
          value={layout}
          onChange={setLayout}
          ariaLabel="Layout"
          options={[
            { value: "grid", label: <span className="sr-only">Grid</span>, icon: <LayoutGrid /> },
            { value: "row", label: <span className="sr-only">List</span>, icon: <Rows3 /> },
          ]}
        />
      </div>

      {(popularTags.length > 0 || tag) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Hash className="size-4 text-fg-3" />
          {tag && !popularTags.some(([t]) => t === tag) && (
            <button type="button" onClick={clearTag} className="inline-flex h-7 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-medium text-primary-fg">
              #{tag} <X className="size-3" />
            </button>
          )}
          {popularTags.map(([t, count]) => (
            <button
              key={t}
              type="button"
              onClick={() => (tag === t ? clearTag() : setTag(t))}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                tag === t ? "border-transparent bg-primary text-primary-fg" : "border-border bg-surface text-fg-2 hover:border-border-strong hover:text-fg",
              )}
            >
              #{t}
              <span className={cn("tabular-nums", tag === t ? "text-primary-fg/80" : "text-fg-3")}>{count}</span>
              {tag === t && <X className="size-3" />}
            </button>
          ))}
        </div>
      )}

      {!notes ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={filtered ? <Search /> : <BookOpen />}
          title={filtered ? "No notes match" : "No notes yet"}
          description={filtered ? "Try another search, or clear some filters." : "Write your first note — format it richly and revise it with spaced repetition."}
          action={
            !filtered && (
              <Link href="/notes/new" className={buttonVariants({ variant: "primary" })}>
                <Plus /> New note
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="-mb-2 text-sm text-fg-3">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
            {filtered && " found"}
          </div>
          <Stagger
            key={`${layout}-${notes.length}-${dq}-${tag}-${skillId}`}
            className={cn("transition-opacity", isValidating && "opacity-60", layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-1 rounded-2xl border border-border bg-surface p-2")}
          >
            {notes.map((n) => (
              <StaggerItem key={n.id}>
                <NoteCard note={n} layout={layout} skill={skillMap.get(n.skillId)} />
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </div>
  )
}
