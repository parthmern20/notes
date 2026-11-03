"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  CodeXml,
  Download,
  Ellipsis,
  LayoutGrid,
  ListChecks,
  Pencil,
  Plus,
  Repeat,
  Rows3,
  Search,
  SquareTerminal,
  Trash,
  Zap,
} from "lucide-react"
import { useCardQueue, useNotes, useSkill, useSnippets, type NotesQuery } from "@/lib/client/api"
import { useDebounced, useStoredState } from "@/lib/client/hooks"
import { shellOf, terminalCommands } from "@/lib/doc"
import { skillStyle } from "@/lib/skill-meta"
import { MASTERY_LEVELS, MASTERY_META } from "@/lib/srs"
import type { MasteryLevel, NoteSummaryDTO, SnippetDTO } from "@/lib/types"
import { cn, downloadFile, safeFilename } from "@/lib/utils"
import { Stagger, StaggerItem } from "@/components/motion/motion"
import { NoteCard } from "@/components/notes/note-card"
import { CodeBlock, TerminalBlock } from "@/components/reader/note-renderer"
import { Flashcard } from "@/components/reader/revision-kit"
import { Takeaways } from "@/components/reader/takeaways"
import { useSkillActions } from "@/components/skills/skill-card"
import { MasteryBadge, SkillIcon } from "@/components/skills/skill-visuals"
import { Button, buttonVariants } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Select } from "@/components/ui/overlays"
import { Card, EmptyState, Input, Skeleton } from "@/components/ui/primitives"
import { Segmented, Tabs } from "@/components/ui/segmented"
import { ErrorState } from "@/components/ui/states"

type Tab = "notes" | "quick" | "cheatsheet" | "cards"
type Sort = NonNullable<NotesQuery["sort"]>

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  )
}

function NotesTab({ skillId }: { skillId: string }) {
  const [q, setQ] = useState("")
  const dq = useDebounced(q.trim(), 250)
  const [sort, setSort] = useState<Sort>("updated")
  const [mastery, setMastery] = useState<"all" | MasteryLevel>("all")
  const [layout, setLayout] = useStoredState<"grid" | "row">("mnemo:notes-layout", "grid")
  const { data: notes, isValidating } = useNotes({ skillId, q: dq || undefined, sort, mastery: mastery === "all" ? undefined : mastery })

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search in this skill…" />
        <Select
          size="sm"
          ariaLabel="Mastery"
          value={mastery}
          onValueChange={setMastery}
          options={[{ value: "all", label: "All levels" }, ...MASTERY_LEVELS.map((l) => ({ value: l, label: MASTERY_META[l].label }))]}
        />
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
      {!notes ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title={dq || mastery !== "all" ? "No matching notes" : "No notes in this skill yet"}
          description={dq || mastery !== "all" ? "Try a different search or filter." : "Write your first note — add commands, code and key takeaways."}
          action={
            !dq &&
            mastery === "all" && (
              <Link href={`/notes/new?skill=${skillId}`} className={buttonVariants({ variant: "primary" })}>
                <Plus /> New note
              </Link>
            )
          }
        />
      ) : (
        <Stagger
          key={`${layout}-${notes.length}`}
          className={cn("transition-opacity", isValidating && "opacity-60", layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-1 rounded-2xl border border-border bg-surface p-2")}
        >
          {notes.map((n) => (
            <StaggerItem key={n.id}>
              <NoteCard note={n} layout={layout} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}

function QuickReviseTab({ notes }: { notes?: NoteSummaryDTO[] }) {
  if (!notes) return <Skeleton className="h-64 rounded-2xl" />
  if (!notes.length) return <EmptyState icon={<ListChecks />} title="Nothing to skim yet" description="Key takeaways from every note in this skill will appear here." />
  const withTakeaways = notes.filter((n) => n.summary.trim())
  return (
    <div className="grid gap-5">
      <p className="text-sm text-fg-3">
        Skim every key takeaway in this skill — a 5-minute refresher before an exam or interview. {withTakeaways.length} of {notes.length} notes have takeaways.
      </p>
      <Stagger className="grid gap-4 lg:grid-cols-2">
        {notes.map((n, i) => (
          <StaggerItem key={n.id}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold text-fg-3">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/notes/${n.id}`} className="font-semibold tracking-tight hover:text-primary-ink">
                    {n.title}
                  </Link>
                </div>
                <MasteryBadge level={n.mastery} />
              </div>
              {n.summary.trim() ? (
                <Takeaways summary={n.summary} className="border-none bg-none p-0 [&>div:first-child]:hidden" />
              ) : (
                <div className="text-sm text-fg-3">
                  <p className="line-clamp-3">{n.excerpt || "No content yet."}</p>
                  <Link href={`/notes/${n.id}/edit`} className="mt-2 inline-flex items-center gap-1 font-medium text-primary-ink hover:underline">
                    Add key takeaways <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

function cheatSheetMarkdown(skillName: string, groups: [string, SnippetDTO[]][]): string {
  const out = [`# ${skillName} — cheat sheet`, ""]
  for (const [, items] of groups) {
    out.push(`## ${items[0].noteTitle}`, "")
    for (const s of items) {
      if (s.heading) out.push(`**${s.heading}**`, "")
      const fence = s.kind === "terminal" ? (s.language === "powershell" ? "powershell" : s.language === "cmd" ? "bat" : "bash") : s.language
      out.push("```" + fence, s.code, "```", "")
    }
  }
  return out.join("\n")
}

function CheatSheetTab({ skillId, skillName }: { skillId: string; skillName: string }) {
  const { data: snippets } = useSnippets(skillId)
  const [kind, setKind] = useState<"all" | "terminal" | "code">("all")
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (snippets ?? []).filter(
      (s) => (kind === "all" || s.kind === kind) && (!needle || `${s.code} ${s.heading ?? ""} ${s.noteTitle}`.toLowerCase().includes(needle)),
    )
  }, [snippets, kind, q])

  const groups = useMemo(() => {
    const map = new Map<string, SnippetDTO[]>()
    for (const s of filtered) map.set(s.noteId, [...(map.get(s.noteId) ?? []), s])
    return [...map.entries()]
  }, [filtered])

  if (!snippets) return <Skeleton className="h-64 rounded-2xl" />
  const terminalCount = snippets.filter((s) => s.kind === "terminal").length
  const allCommands = filtered.filter((s) => s.kind === "terminal").flatMap((s) => terminalCommands(s.code.split("\n"), shellOf(s.language)))

  if (!snippets.length) {
    return (
      <EmptyState
        icon={<SquareTerminal />}
        title="Your cheat sheet builds itself"
        description="Add a Terminal command or Code snippet block to any note in this skill and it appears here — searchable, with one-click copy."
      />
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={kind}
          onChange={setKind}
          ariaLabel="Snippet type"
          options={[
            { value: "all", label: "All", count: snippets.length },
            { value: "terminal", label: "Commands", icon: <SquareTerminal />, count: terminalCount },
            { value: "code", label: "Code", icon: <CodeXml />, count: snippets.length - terminalCount },
          ]}
        />
        <SearchBox value={q} onChange={setQ} placeholder="Search commands and code…" />
        <div className="ml-auto flex gap-2">
          {allCommands.length > 0 && (
            <CopyButton
              text={allCommands.join("\n")}
              label={`Copy ${allCommands.length} commands`}
              className="h-8 rounded-lg border border-border bg-surface px-3 text-[13px] text-fg-2 shadow-soft hover:bg-surface-2 hover:text-fg"
            />
          )}
          <Button size="sm" onClick={() => downloadFile(`${safeFilename(skillName)}-cheatsheet.md`, cheatSheetMarkdown(skillName, groups), "text/markdown")}>
            <Download /> Export
          </Button>
        </div>
      </div>
      {groups.length === 0 ? (
        <EmptyState icon={<Search />} title="No matches" description="Try another search term." className="py-10" />
      ) : (
        groups.map(([noteId, items]) => (
          <section key={noteId} className="grid gap-3">
            <Link href={`/notes/${noteId}`} className="group flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span className="group-hover:text-primary-ink">{items[0].noteTitle}</span>
              <ArrowRight className="size-4 text-fg-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <div className="grid gap-3 xl:grid-cols-2">
              {items.map((s, i) => (
                <div key={i} className="grid content-start gap-1.5">
                  {s.heading && <div className="text-xs font-medium text-fg-3">{s.heading}</div>}
                  {s.kind === "terminal" ? <TerminalBlock lines={s.code.split("\n")} shell={shellOf(s.language)} /> : <CodeBlock code={s.code} language={s.language} />}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function CardsTab({ skillId }: { skillId: string }) {
  const { data: items } = useCardQueue({ skillId, mode: "all" })
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  if (!items) return <Skeleton className="h-64 rounded-2xl" />
  if (!items.length)
    return (
      <EmptyState
        icon={<Zap />}
        title="No flashcards yet"
        description="Add question → answer cards while editing a note (or let AI draft them), then study them here."
      />
    )
  const due = items.filter((i) => new Date(i.card.srs.dueAt) <= new Date()).length
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-fg-3">
          {items.length} flashcards · {due} due now
        </p>
        <Link href={`/revise/flashcards?skill=${skillId}&mode=all`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Study all
        </Link>
        <Link href={`/revise/flashcards?skill=${skillId}`} className={buttonVariants({ variant: "primary", size: "sm" })}>
          <Zap /> Study {due} due
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ card, noteTitle }) => (
          <Flashcard
            key={card.id}
            question={card.question}
            answer={card.answer}
            flipped={Boolean(flipped[card.id])}
            onFlip={() => setFlipped((f) => ({ ...f, [card.id]: !f[card.id] }))}
            meta={<span className="max-w-[55%] truncate normal-case tracking-normal">{noteTitle}</span>}
          />
        ))}
      </div>
    </div>
  )
}

export function SkillDetailView({ id }: { id: string }) {
  const router = useRouter()
  const { data: skill, error, mutate } = useSkill(id)
  const [tab, setTab] = useStoredState<Tab>(`mnemo:skill-tab`, "notes")
  const { data: quickNotes } = useNotes({ skillId: id, sort: "created", limit: 500 }, tab === "quick")
  const { edit, remove, newNote } = useSkillActions()

  useEffect(() => {
    if (skill) document.title = `${skill.name} · Mnemo`
  }, [skill])

  if (error && !skill) return <ErrorState error={error} onRetry={() => mutate()} title="Couldn't open this skill" />
  if (!skill) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const s = skill.stats
  const chips = [
    { label: "notes", value: s.notes },
    { label: "flashcards", value: s.flashcards },
    { label: "due", value: s.due + s.cardsDue },
    { label: "mastery", value: `${s.mastery}%` },
  ]

  return (
    <div className="grid gap-6">
      <section style={skillStyle(skill.color)} className="skill-scope relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_130%_at_100%_0%,var(--skill-soft),transparent_65%)]" />
        <div aria-hidden className="absolute -bottom-24 -left-24 size-64 rounded-full bg-[var(--skill-soft)] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <SkillIcon icon={skill.icon} color={skill.color} size="lg" solid className="size-16 rounded-2xl [&_svg]:size-8" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{skill.name}</h1>
            {skill.description && <p className="mt-1 max-w-2xl text-[15px] text-fg-3">{skill.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c.label} className="inline-flex items-baseline gap-1.5 rounded-full border border-border bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] px-3 py-1 text-sm backdrop-blur">
                  <span className="font-semibold tabular-nums">{c.value}</span>
                  <span className="text-xs text-fg-3">{c.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => newNote(skill)}>
              <Plus /> New note
            </Button>
            <Link href={`/revise/flashcards?skill=${skill.id}`} className={buttonVariants({ variant: "secondary" })}>
              <Zap /> Flashcards
            </Link>
            <Link href={`/revise/session?skill=${skill.id}${s.due ? "" : "&mode=all"}`} className={buttonVariants({ variant: "primary" })}>
              <Repeat /> {s.due ? `Revise ${s.due} due` : "Revise all"}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Skill actions">
                <Ellipsis />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem icon={<Pencil />} onSelect={() => edit(skill)}>
                  Edit skill
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<Trash />} tone="danger" onSelect={() => void remove(skill, () => router.push("/skills"))}>
                  Delete skill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "notes", label: "Notes", icon: <BookOpen />, count: s.notes },
          { value: "quick", label: "Quick revise", icon: <ListChecks /> },
          { value: "cheatsheet", label: "Cheat sheet", icon: <SquareTerminal /> },
          { value: "cards", label: "Flashcards", icon: <Zap />, count: s.flashcards },
        ]}
      />

      {tab === "notes" && <NotesTab skillId={skill.id} />}
      {tab === "quick" && <QuickReviseTab notes={quickNotes} />}
      {tab === "cheatsheet" && <CheatSheetTab skillId={skill.id} skillName={skill.name} />}
      {tab === "cards" && <CardsTab skillId={skill.id} />}
    </div>
  )
}
