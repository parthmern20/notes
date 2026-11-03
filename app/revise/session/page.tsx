import { Suspense } from "react"
import type { Metadata } from "next"
import { SessionView } from "@/components/views/session-view"

export const metadata: Metadata = { title: "Revision session" }

export default function SessionPage() {
  return (
    <Suspense>
      <SessionView />
    </Suspense>
  )
}
