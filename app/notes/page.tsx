import { Suspense } from "react"
import type { Metadata } from "next"
import { NotesView } from "@/components/views/notes-view"

export const metadata: Metadata = { title: "All notes" }

export default function NotesPage() {
  return (
    <Suspense>
      <NotesView />
    </Suspense>
  )
}
