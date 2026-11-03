"use client"

import useSWR, { mutate, type SWRConfiguration } from "swr"
import type {
  CardQueueItem,
  FlashcardInput,
  MetaDTO,
  NoteDTO,
  NoteInput,
  NoteResponse,
  NoteSummaryDTO,
  Rating,
  ReviewMode,
  ReviewResult,
  SearchResponse,
  SkillDTO,
  SkillInput,
  SnippetDTO,
  StatsDTO,
} from "@/lib/types"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

export async function apiFetch<T>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  headers.set("x-timezone", timeZone())
  if (json !== undefined) headers.set("content-type", "application/json")
  let res: Response
  try {
    res = await fetch(url, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body })
  } catch {
    throw new ApiError(0, "You appear to be offline. Check your connection and try again.")
  }
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    const body = data as { error?: string; details?: unknown } | null
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`, body?.details)
  }
  return data as T
}

export const fetcher = <T>(url: string) => apiFetch<T>(url)

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong"
}

const toQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue
    qs.set(k, v === true ? "1" : String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ""
}

// ───────────── Queries ─────────────

const keep: SWRConfiguration = { keepPreviousData: true }

export const useSkills = () => useSWR<SkillDTO[]>("/api/skills")
export const useSkill = (id?: string | null) => useSWR<SkillDTO>(id ? `/api/skills/${id}` : null)
export const useNote = (id?: string | null) => useSWR<NoteResponse>(id ? `/api/notes/${id}` : null)
export const useStats = (days: number) => useSWR<StatsDTO>(`/api/stats${toQuery({ days })}`, keep)
export const useMeta = () => useSWR<MetaDTO>("/api/meta", { revalidateOnFocus: false })
export const useSnippets = (skillId?: string | null) =>
  useSWR<SnippetDTO[]>(skillId ? `/api/snippets${toQuery({ skillId })}` : null)

export interface NotesQuery {
  skillId?: string
  q?: string
  tag?: string
  mastery?: string
  important?: boolean
  due?: boolean
  sort?: "updated" | "created" | "title" | "due" | "mastery"
  limit?: number
}

export const useNotes = (query: NotesQuery, enabled = true) =>
  useSWR<NoteSummaryDTO[]>(enabled ? `/api/notes${toQuery({ ...query })}` : null, keep)

export interface QueueQuery {
  skillId?: string
  mode?: ReviewMode
  limit?: number
}

export const queueUrl = (q: QueueQuery) => `/api/revise/queue${toQuery({ ...q })}`
export const cardsUrl = (q: { skillId?: string; noteId?: string; mode?: "due" | "all"; limit?: number }) =>
  `/api/revise/cards${toQuery({ ...q })}`

export const useQueue = (q: QueueQuery) => useSWR<NoteSummaryDTO[]>(queueUrl(q), keep)
export const useCardQueue = (q: { skillId?: string; noteId?: string; mode?: "due" | "all" }, enabled = true) =>
  useSWR<CardQueueItem[]>(enabled ? cardsUrl(q) : null, keep)

export const searchApi = (q: string) => apiFetch<SearchResponse>(`/api/search${toQuery({ q })}`)

// ───────────── Cache invalidation ─────────────

export function revalidate(...prefixes: string[]) {
  return mutate((key) => typeof key === "string" && prefixes.some((p) => key.startsWith(p)))
}

/** Everything derived from notes: lists, stats, skill rollups, queues and snippets. */
export const revalidateNotesData = () =>
  revalidate("/api/notes", "/api/skills", "/api/stats", "/api/revise", "/api/snippets")

// ───────────── Mutations ─────────────

export const api = {
  createSkill: (input: SkillInput) => apiFetch<SkillDTO>("/api/skills", { method: "POST", json: input }),
  updateSkill: (id: string, input: Partial<SkillInput>) =>
    apiFetch<SkillDTO>(`/api/skills/${id}`, { method: "PATCH", json: input }),
  deleteSkill: (id: string) => apiFetch<{ deleted: boolean; notes: number }>(`/api/skills/${id}`, { method: "DELETE" }),

  createNote: (input: NoteInput) => apiFetch<NoteDTO>("/api/notes", { method: "POST", json: input }),
  updateNote: (id: string, input: Partial<NoteInput>) =>
    apiFetch<NoteDTO>(`/api/notes/${id}`, { method: "PATCH", json: input }),
  deleteNote: (id: string) => apiFetch<{ deleted: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),

  reviewNote: (id: string, rating: Rating, durationMs: number) =>
    apiFetch<ReviewResult>(`/api/notes/${id}/review`, { method: "POST", json: { rating, durationMs } }),
  reviewCard: (noteId: string, cardId: string, rating: Rating, durationMs: number) =>
    apiFetch<ReviewResult>(`/api/notes/${noteId}/cards/${cardId}/review`, {
      method: "POST",
      json: { rating, durationMs },
    }),

  generate: <T extends "takeaways" | "flashcards">(task: T, title: string, markdown: string) =>
    apiFetch<T extends "takeaways" ? { takeaways: string[] } : { flashcards: FlashcardInput[] }>("/api/ai", {
      method: "POST",
      json: { task, title, markdown },
    }),

  importBackup: (file: unknown) =>
    apiFetch<{ skills: number; notes: number; reviews: number }>("/api/backup", { method: "POST", json: file }),
}
