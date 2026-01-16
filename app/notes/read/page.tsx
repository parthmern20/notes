"use client"

import useSWR from "swr"
import { Header } from "@/components/header"
import { NoteReader } from "@/components/note-reader"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_ALL_NOTES } from "@/lib/graphql/client"
import type { LectureNote } from "@/types/lecture-note"

interface NotesResponse {
  getAllNotes: LectureNote[]
}

export default function ReadAllNotesPage() {
  const { data, isLoading } = useSWR<NotesResponse>("getAllNotes", () => graphqlClient<NotesResponse>(GET_ALL_NOTES))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Read All Notes</h1>
          <p className="mt-2 text-muted-foreground">All your lecture notes in one continuous reading view.</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <NoteReader notes={data?.getAllNotes || []} />
        )}
      </main>
    </div>
  )
}
