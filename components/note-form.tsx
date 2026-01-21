"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { graphqlClient, CREATE_NOTE, UPDATE_NOTE, GENERATE_AI_CONTENT } from "@/lib/graphql/client"
import type { LectureNote, CreateNoteInput, UpdateNoteInput } from "@/types/lecture-note"
import { Loader2, Sparkles } from "lucide-react"

interface NoteFormProps {
  note?: LectureNote
  mode: "create" | "edit"
}

export function NoteForm({ note, mode }: NoteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    lectureTitle: note?.lectureTitle || "",
    noteTitle: note?.noteTitle || "",
    content: note?.content || "",
    sequence: note?.sequence || 1,
  })

  const handleGenerateAI = async () => {
    if (!note) return
    setIsGeneratingAI(true)
    setError(null)

    try {
      console.log("[v0] Starting AI generation for note:", note.id)
      const result = await graphqlClient<{ generateAIContent: LectureNote }>(GENERATE_AI_CONTENT, {
        id: note.id,
      })
      console.log("[v0] AI generation completed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI content")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === "create") {
        const input: CreateNoteInput = {
          lectureTitle: formData.lectureTitle.trim(),
          noteTitle: formData.noteTitle.trim(),
          content: formData.content,
          sequence: formData.sequence,
        }
        await graphqlClient<{ createNote: LectureNote }>(CREATE_NOTE, { input })
      } else if (note) {
        const input: UpdateNoteInput = {
          noteTitle: formData.noteTitle.trim(),
          content: formData.content,
          sequence: formData.sequence,
        }
        await graphqlClient<{ updateNote: LectureNote }>(UPDATE_NOTE, {
          id: note.id,
          input,
        })
      }
      router.push("/notes")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add New Note" : "Edit Note"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Create a new lecture note with the form below." : "Update the note details below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="lectureTitle">Lecture Title / Number</Label>
            <Input
              id="lectureTitle"
              value={formData.lectureTitle}
              onChange={(e) => setFormData({ ...formData, lectureTitle: e.target.value })}
              placeholder="e.g., Lecture 1: Introduction to Programming"
              required
              disabled={mode === "edit"}
              className={mode === "edit" ? "bg-muted" : ""}
            />
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">Lecture title cannot be changed after creation</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="noteTitle">Note Title</Label>
            <Input
              id="noteTitle"
              value={formData.noteTitle}
              onChange={(e) => setFormData({ ...formData, noteTitle: e.target.value })}
              placeholder="e.g., Variables and Data Types"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sequence">Sequence Number</Label>
            <Input
              id="sequence"
              type="number"
              min={1}
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: Number.parseInt(e.target.value) || 1 })}
              required
            />
            <p className="text-xs text-muted-foreground">Order of the note within the lecture (1, 2, 3...)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your lecture notes here..."
              rows={12}
              required
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading || isGeneratingAI} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Note" : "Save Changes"}
            </Button>
            {mode === "edit" && note && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateAI}
                disabled={isLoading || isGeneratingAI}
                className="flex-1"
              >
                {isGeneratingAI && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isGeneratingAI && <Sparkles className="mr-2 h-4 w-4" />}
                Generate AI Content
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading || isGeneratingAI}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
