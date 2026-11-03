import { Suspense } from "react"
import type { Metadata } from "next"
import { NoteEditorView } from "@/components/views/note-editor-view"

export const metadata: Metadata = { title: "Edit note" }

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense>
      <NoteEditorView noteId={id} />
    </Suspense>
  )
}
