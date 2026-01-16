"use client"

import useSWR from "swr"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_ALL_NOTES, GET_LECTURE_TITLES } from "@/lib/graphql/client"
import type { LectureNote } from "@/types/lecture-note"
import { BookOpen, FileText, Plus, List } from "lucide-react"

interface NotesResponse {
  getAllNotes: LectureNote[]
}

interface TitlesResponse {
  getLectureTitles: string[]
}

export default function DashboardPage() {
  const { data: notesData, isLoading: notesLoading } = useSWR<NotesResponse>("getAllNotes", () =>
    graphqlClient<NotesResponse>(GET_ALL_NOTES),
  )

  const { data: titlesData, isLoading: titlesLoading } = useSWR<TitlesResponse>("getLectureTitles", () =>
    graphqlClient<TitlesResponse>(GET_LECTURE_TITLES),
  )

  const totalNotes = notesData?.getAllNotes.length || 0
  const totalLectures = titlesData?.getLectureTitles.length || 0
  const recentNotes = notesData?.getAllNotes.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage and organize your lecture notes in one place.</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {titlesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalLectures}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {notesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalNotes}</div>
              )}
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/notes/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/notes">
                  <List className="mr-2 h-4 w-4" />
                  View All
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/notes/read">
                  <FileText className="mr-2 h-4 w-4" />
                  Read Notes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your most recently updated lecture notes</CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{note.noteTitle}</p>
                      <p className="truncate text-sm text-muted-foreground">{note.lectureTitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No notes yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/notes/add">Create your first note</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
