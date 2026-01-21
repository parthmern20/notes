"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, Loader2, Sparkles } from "lucide-react"
import { graphqlClient, DELETE_NOTE } from "@/lib/graphql/client"
import type { LectureNote } from "@/types/lecture-note"

interface NotesTableProps {
  notes: LectureNote[]
  onRefresh: () => void
}

export function NotesTable({ notes, onRefresh }: NotesTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group notes by lecture
  const groupedNotes = notes.reduce(
    (acc, note) => {
      if (!acc[note.lectureTitle]) {
        acc[note.lectureTitle] = []
      }
      acc[note.lectureTitle].push(note)
      return acc
    },
    {} as Record<string, LectureNote[]>,
  )

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await graphqlClient<{ deleteNote: boolean }>(DELETE_NOTE, { id: deleteId })
      onRefresh()
    } catch (error) {
      console.error("Failed to delete note:", error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No notes found</p>
        <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first lecture note.</p>
        <Button asChild className="mt-4">
          <Link href="/notes/add">Add Note</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedNotes).map(([lectureTitle, lectureNotes]) => (
          <div key={lectureTitle} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{lectureTitle}</h3>
              <Badge variant="secondary">{lectureNotes.length} notes</Badge>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Seq</TableHead>
                    <TableHead>Note Title</TableHead>
                    <TableHead className="hidden w-12 md:table-cell">AI</TableHead>
                    <TableHead className="hidden md:table-cell">Updated</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lectureNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-mono text-muted-foreground">{note.sequence}</TableCell>
                      <TableCell className="font-medium">{note.noteTitle}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {note.summary && note.practiceQuestions && note.practiceQuestions.length > 0 ? (
                          <Sparkles className="h-4 w-4 text-yellow-500" title="AI-generated content" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/notes/${note.id}`)}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/notes/${note.id}/edit`)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(note.id)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this note from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
