import { Suspense } from "react"
import type { Metadata } from "next"
import { FlashcardsSessionView } from "@/components/views/flashcards-session-view"

export const metadata: Metadata = { title: "Flashcards" }

export default function FlashcardsPage() {
  return (
    <Suspense>
      <FlashcardsSessionView />
    </Suspense>
  )
}
