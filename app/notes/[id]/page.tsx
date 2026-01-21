"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { NoteReader } from "@/components/note-reader"
import { AIContentViewer } from "@/components/ai-content-viewer"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_NOTE_BY_ID, UPDATE_NOTE } from "@/lib/graphql/client"
import type { LectureNote, PracticeQuestion, UpdateNoteInput } from "@/types/lecture-note"
import { ArrowLeft, Pencil } from "lucide-react"

interface NoteResponse {
  getNoteById: LectureNote | null
}

export default function ViewNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

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
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {note && (
            <Button asChild variant="outline">
              <Link href={`/notes/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Note
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : note ? (
          <div className="space-y-8">
            <NoteReader notes={[note]} showLectureHeaders={true} />
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
            <Button asChild className="mt-4">
              <Link href="/notes">Back to Notes</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
