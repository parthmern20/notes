"use client"

import { use } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { NoteForm } from "@/components/note-form"
import { AIContentViewer } from "@/components/ai-content-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_NOTE_BY_ID, UPDATE_NOTE } from "@/lib/graphql/client"
import type { LectureNote, PracticeQuestion, UpdateNoteInput } from "@/types/lecture-note"

interface NoteResponse {
  getNoteById: LectureNote | null
}

export default function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data, isLoading, mutate } = useSWR<NoteResponse>(`note-${id}`, () =>
    graphqlClient<NoteResponse>(GET_NOTE_BY_ID, { id }),
  )

  const note = data?.getNoteById

  const handleSaveAIContent = async (summary: string, questions: PracticeQuestion[]) => {
    try {
      const input: UpdateNoteInput = {
        summary,
        practiceQuestions: questions,
      }
      await graphqlClient<{ updateNote: LectureNote }>(UPDATE_NOTE, {
        id,
        input,
      })
      mutate()
    } catch (error) {
      console.error("Error saving AI content:", error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : note ? (
          <div className="space-y-8">
            <NoteForm note={note} mode="edit" />
            <AIContentViewer
              summary={note.summary}
              practiceQuestions={note.practiceQuestions}
              isEditable={true}
              onSaveContent={handleSaveAIContent}
            />
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Note not found</p>
          </div>
        )}
      </main>
    </div>
  )
}
