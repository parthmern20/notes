"use client"

import useSWR from "swr"
import { Header } from "@/components/header"
import { NotesTable } from "@/components/notes-table"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_ALL_NOTES } from "@/lib/graphql/client"
import type { LectureNote } from "@/types/lecture-note"

interface NotesResponse {
  getAllNotes: LectureNote[]
}

export default function NotesPage() {
  const { data, isLoading, mutate } = useSWR<NotesResponse>("getAllNotes", () =>
    graphqlClient<NotesResponse>(GET_ALL_NOTES),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">All Notes</h1>
          <p className="mt-2 text-muted-foreground">View and manage all your lecture notes organized by lecture.</p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <NotesTable notes={data?.getAllNotes || []} onRefresh={() => mutate()} />
        )}
      </main>
    </div>
  )
}
