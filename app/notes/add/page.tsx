import { Header } from "@/components/header"
import { NoteForm } from "@/components/note-form"

export default function AddNotePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <NoteForm mode="create" />
      </main>
    </div>
  )
}
