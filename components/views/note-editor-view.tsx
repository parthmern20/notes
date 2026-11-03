"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { motion } from "motion/react"
import { mutate } from "swr"
import { toast } from "sonner"
import { ArrowLeft, Check, Clock3, Lightbulb, Link2, ListChecks, Plus, Sparkles, Star, Wand } from "lucide-react"
import { api, errorMessage, revalidateNotesData, useMeta, useNote, useNotes, useSkills } from "@/lib/client/api"
import { readStorage, useHotkeys, writeStorage } from "@/lib/client/hooks"
import { docToMarkdown, EMPTY_DOC, isDocEmpty, type DocNode } from "@/lib/doc"
import type { Difficulty, NoteDTO, NoteInput } from "@/lib/types"
import { cn } from "@/lib/utils"
import { RichEditor } from "@/components/editor/rich-editor"
import { FlashcardsEditor, newCardKey, type EditableCard } from "@/components/notes/flashcards-editor"
import { TagInput } from "@/components/notes/tag-input"
import { useAppUI } from "@/components/shell/app-ui"
import { SkillIcon } from "@/components/skills/skill-visuals"
import { Button, buttonVariants } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { Select, Switch } from "@/components/ui/overlays"
import { Card, CardHeader, Field, Input, Kbd, Skeleton, Textarea } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"
import { ErrorState } from "@/components/ui/states"

interface Draft {
  title: string
  skillId: string
  tags: string[]
  difficulty: Difficulty
  important: boolean
  source: string
  summary: string
  cards: EditableCard[]
  content: DocNode
  savedAt: number
}

const draftKey = (noteId?: string) => `mnemo:draft:${noteId ?? "new"}`

function toCards(note?: NoteDTO): EditableCard[] {
  return (note?.flashcards ?? []).map((c) => ({ key: c.id, id: c.id, question: c.question, answer: c.answer }))
}

export function NoteEditorView({ noteId }: { noteId?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const confirm = useConfirm()
  const { openSkillDialog } = useAppUI()
  const isNew = !noteId

  const { data: loaded, error, mutate: reload } = useNote(noteId)
  const { data: skills } = useSkills()
  const { data: meta } = useMeta()
  const { data: allNotes } = useNotes({ limit: 500 })

  const [ready, setReady] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [initialContent, setInitialContent] = useState<DocNode>(EMPTY_DOC)
  const contentRef = useRef<DocNode>(EMPTY_DOC)
  const [title, setTitle] = useState("")
  const [skillId, setSkillId] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [important, setImportant] = useState(false)
  const [source, setSource] = useState("")
  const [summary, setSummary] = useState("")
  const [cards, setCards] = useState<EditableCard[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [generating, setGenerating] = useState<"takeaways" | "flashcards" | null>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  const markDirty = useCallback(() => setDirty(true), [])

  // Initialise once: from the server note (edit) or an empty note (new), then look for a newer local draft.
  useEffect(() => {
    if (ready) return
    if (!isNew && !loaded) return
    const note = loaded?.note
    const doc = note?.content ?? EMPTY_DOC
    setInitialContent(doc)
    contentRef.current = doc
    setTitle(note?.title ?? "")
    setSkillId(note?.skillId ?? params.get("skill") ?? "")
    setTags(note?.tags ?? [])
    setDifficulty(note?.difficulty ?? "medium")
    setImportant(note?.important ?? false)
    setSource(note?.source ?? "")
    setSummary(note?.summary ?? "")
    setCards(toCards(note))
    setLastSaved(note ? new Date(note.updatedAt) : null)
    const saved = readStorage<Draft | null>(draftKey(noteId), null)
    if (saved && (!note || saved.savedAt > Date.parse(note.updatedAt))) setDraft(saved)
    setReady(true)
  }, [ready, isNew, loaded, noteId, params])

  // Default a new note to the first skill once skills arrive.
  useEffect(() => {
    if (ready && isNew && !skillId && skills?.length) setSkillId(skills[0].id)
  }, [ready, isNew, skillId, skills])

  // Autosave a local draft so nothing is lost on a crash or accidental close.
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(() => {
      writeStorage(draftKey(noteId), {
        title,
        skillId,
        tags,
        difficulty,
        important,
        source,
        summary,
        cards,
        content: contentRef.current,
        savedAt: Date.now(),
      } satisfies Draft)
    }, 800)
    return () => clearTimeout(t)
  })

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [title, ready])

  const restoreDraft = () => {
    if (!draft) return
    setTitle(draft.title)
    setSkillId(draft.skillId)
    setTags(draft.tags)
    setDifficulty(draft.difficulty)
    setImportant(draft.important)
    setSource(draft.source)
    setSummary(draft.summary)
    setCards(draft.cards)
    setInitialContent(draft.content)
    contentRef.current = draft.content
    setEditorKey((k) => k + 1)
    setDraft(null)
    setDirty(true)
    toast.success("Draft restored")
  }

  const discardDraft = () => {
    writeStorage(draftKey(noteId), undefined)
    setDraft(null)
  }

  const save = async (then: "stay" | "view") => {
    if (saving) return
    if (!title.trim()) {
      toast.error("Give your note a title")
      titleRef.current?.focus()
      return
    }
    if (!skillId) {
      toast.error("Choose a skill for this note")
      return
    }
    const filled = cards.filter((c) => c.question.trim() || c.answer.trim())
    if (filled.some((c) => !c.question.trim() || !c.answer.trim())) {
      toast.error("Each flashcard needs both a question and an answer")
      return
    }
    const input: NoteInput = {
      skillId,
      title: title.trim(),
      content: contentRef.current,
      summary: summary.trim(),
      tags,
      difficulty,
      important,
      source: source.trim(),
      flashcards: filled.map(({ id, question, answer }) => ({ id, question: question.trim(), answer: answer.trim() })),
    }
    setSaving(true)
    try {
      const note = isNew ? await api.createNote(input) : await api.updateNote(noteId!, input)
      writeStorage(draftKey(noteId), undefined)
      setDirty(false)
      setLastSaved(new Date())
      setCards(toCards(note))
      await mutate(`/api/notes/${note.id}`)
      void revalidateNotesData()
      toast.success(isNew ? "Note created" : "Note saved")
      if (then === "view") router.push(`/notes/${note.id}`)
      else if (isNew) router.replace(`/notes/${note.id}/edit`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  useHotkeys("mod+s", () => void save("stay"), { allowInInputs: true })

  const generate = async (task: "takeaways" | "flashcards") => {
    if (isDocEmpty(contentRef.current)) {
      toast.error("Write some content first — AI works from your note.")
      return
    }
    if (task === "takeaways" && summary.trim()) {
      const ok = await confirm({ title: "Replace your key takeaways?", description: "The AI version will replace what you've written.", confirmLabel: "Replace" })
      if (!ok) return
    }
    setGenerating(task)
    try {
      const markdown = docToMarkdown(contentRef.current, { images: false })
      if (task === "takeaways") {
        const { takeaways } = await api.generate("takeaways", title, markdown)
        setSummary(takeaways.join("\n"))
        toast.success(`Added ${takeaways.length} key takeaways`)
      } else {
        const { flashcards } = await api.generate("flashcards", title, markdown)
        const existing = new Set(cards.map((c) => c.question.trim().toLowerCase()))
        const fresh = flashcards.filter((c) => !existing.has(c.question.trim().toLowerCase()))
        setCards((prev) => [...prev.filter((c) => c.question.trim() || c.answer.trim()), ...fresh.map((c) => ({ ...c, key: newCardKey() }))])
        toast.success(fresh.length ? `Added ${fresh.length} flashcards — review and edit them` : "No new flashcards to add")
      }
      markDirty()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setGenerating(null)
    }
  }

  const tagSuggestions = useMemo(() => [...new Set(allNotes?.flatMap((n) => n.tags) ?? [])].sort(), [allNotes])
  const skill = skills?.find((s) => s.id === skillId)
  const aiEnabled = Boolean(meta?.ai)

  if (!isNew && error && !loaded) return <ErrorState error={error} onRetry={() => reload()} title="Couldn't open this note" />
  if (!ready) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-12 w-2/3 rounded-xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    )
  }

  const status = saving ? "Saving…" : dirty ? "Unsaved changes" : lastSaved ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}` : "Not saved yet"

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 -mt-6 mb-6 flex h-14 items-center gap-3 border-b border-border/70 bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8">
        <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            {skill && <SkillIcon icon={skill.icon} color={skill.color} size="xs" />}
            <span className="truncate font-medium">{isNew ? "New note" : title || "Untitled"}</span>
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs", dirty ? "text-warning-ink" : "text-fg-3")}>
            {dirty ? (
              <motion.span className="size-1.5 rounded-full bg-warning" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
            ) : (
              lastSaved && <Check className="size-3" />
            )}
            {status}
          </div>
        </div>
        <span className="hidden items-center gap-1 text-xs text-fg-3 md:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>S</Kbd> to save
        </span>
        {!isNew && (
          <Link href={`/notes/${noteId}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
            Cancel
          </Link>
        )}
        <Button variant="primary" size="sm" loading={saving} onClick={() => void save("view")}>
          {!saving && <Check />} {isNew ? "Create note" : "Save"}
        </Button>
      </div>

      {draft && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--warning)_40%,var(--border))] bg-[color-mix(in_oklab,var(--warning)_8%,var(--surface))] px-4 py-3">
          <Clock3 className="size-5 text-warning-ink" />
          <div className="min-w-0 flex-1 text-sm">
            <span className="font-medium">Unsaved draft found</span>
            <span className="text-fg-3"> · from {formatDistanceToNow(draft.savedAt, { addSuffix: true })}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={discardDraft}>
            Discard
          </Button>
          <Button size="sm" variant="primary" onClick={restoreDraft}>
            Restore draft
          </Button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-6">
          <textarea
            ref={titleRef}
            value={title}
            rows={1}
            maxLength={160}
            placeholder="Note title"
            aria-label="Note title"
            autoFocus={isNew}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, " "))
              markDirty()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                document.querySelector<HTMLElement>(".ProseMirror")?.focus()
              }
            }}
            className="w-full resize-none overflow-hidden bg-transparent text-3xl font-semibold leading-tight tracking-tight outline-none placeholder:text-fg-3/60 sm:text-4xl"
          />

          <RichEditor
            key={editorKey}
            initialContent={initialContent}
            onChange={(doc) => {
              contentRef.current = doc
              markDirty()
            }}
            toolbarClassName="top-[120px]"
          />

          <Card>
            <CardHeader
              icon={<ListChecks />}
              title="Key takeaways"
              description="The 3–7 points to remember. Shown first when you revise — one per line."
              action={
                aiEnabled && (
                  <Button size="sm" variant="soft" onClick={() => void generate("takeaways")} loading={generating === "takeaways"}>
                    {generating !== "takeaways" && <Sparkles />} Generate with AI
                  </Button>
                )
              }
            />
            <div className="p-5">
              <Textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value)
                  markDirty()
                }}
                placeholder={"S3 is object storage with 11 nines of durability\nUse `aws s3 sync` to mirror a folder to a bucket"}
                rows={5}
                maxLength={4000}
                aria-label="Key takeaways"
              />
            </div>
          </Card>

          <FlashcardsEditor
            cards={cards}
            onChange={(next) => {
              setCards(next)
              markDirty()
            }}
            onGenerate={() => void generate("flashcards")}
            generating={generating === "flashcards"}
            aiEnabled={aiEnabled}
          />
        </div>

        <aside className="grid content-start gap-4 lg:sticky lg:top-[136px] lg:max-h-[calc(100dvh-152px)] lg:overflow-y-auto">
          <Card className="grid gap-4 p-5">
            <Field label="Skill">
              {skills?.length ? (
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    ariaLabel="Skill"
                    value={skillId || undefined}
                    placeholder="Choose a skill"
                    onValueChange={(v) => {
                      setSkillId(v)
                      markDirty()
                    }}
                    options={skills.map((s) => ({ value: s.id, label: s.name, icon: <SkillIcon icon={s.icon} color={s.color} size="xs" className="size-5" /> }))}
                  />
                  <Button
                    size="icon"
                    aria-label="New skill"
                    onClick={() =>
                      openSkillDialog(undefined, (s) => {
                        setSkillId(s.id)
                        markDirty()
                      })
                    }
                  >
                    <Plus />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="soft"
                  onClick={() =>
                    openSkillDialog(undefined, (s) => {
                      setSkillId(s.id)
                      markDirty()
                    })
                  }
                >
                  <Plus /> Create a skill first
                </Button>
              )}
            </Field>
            <Field label="Tags" hint="Press Enter or comma to add">
              <TagInput
                value={tags}
                onChange={(t) => {
                  setTags(t)
                  markDirty()
                }}
                suggestions={tagSuggestions}
                placeholder="e.g. networking, exam"
              />
            </Field>
            <Field label="Difficulty">
              <Segmented
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
                value={difficulty}
                onChange={(d) => {
                  setDifficulty(d)
                  markDirty()
                }}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </Field>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <Star className={cn("size-4", important ? "fill-[#f5b53d] text-[#f5b53d]" : "text-fg-3")} />
                <span>
                  <span className="font-medium">Important</span>
                  <span className="block text-xs text-fg-3">Revise it in “Important” sessions</span>
                </span>
              </span>
              <Switch
                checked={important}
                onCheckedChange={(v) => {
                  setImportant(v)
                  markDirty()
                }}
              />
            </label>
            <Field label="Source" hint="Course, docs or video you learned this from">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
                <Input
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value)
                    markDirty()
                  }}
                  placeholder="https://…"
                  className="pl-9"
                  maxLength={500}
                />
              </div>
            </Field>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-4 text-[#e8a20b]" /> Writing tips
            </div>
            <ul className="grid gap-2.5 text-[13px] leading-relaxed text-fg-3">
              <li>
                Type <Kbd>/</Kbd> for headings, <b className="text-fg-2">terminal commands</b>, code, callouts and tables.
              </li>
              <li>
                <b className="text-fg-2">Bold</b> and <mark className="rounded bg-[var(--hl-yellow)] px-1 text-fg">highlight</mark> key terms — Recall mode hides them so you can test yourself.
              </li>
              <li>Paste a screenshot straight in with Ctrl V.</li>
              <li>
                Add a <b className="text-fg-2">Remember</b> callout for must-know facts.
              </li>
              {aiEnabled && (
                <li className="flex gap-1.5">
                  <Wand className="mt-0.5 size-3.5 shrink-0 text-primary-ink" /> AI can draft takeaways and flashcards from your note.
                </li>
              )}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
