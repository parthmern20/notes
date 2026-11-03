import { Suspense } from "react"
import type { Metadata } from "next"
import { NoteEditorView } from "@/components/views/note-editor-view"

export const metadata: Metadata = { title: "New note" }

export default function NewNotePage() {
  return (
    <Suspense>
      <NoteEditorView />
    </Suspense>
  )
}
