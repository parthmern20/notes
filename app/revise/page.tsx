import type { Metadata } from "next"
import { ReviseView } from "@/components/views/revise-view"

export const metadata: Metadata = { title: "Revise" }

export default function RevisePage() {
  return <ReviseView />
}
