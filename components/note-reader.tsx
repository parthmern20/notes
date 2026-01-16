import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { LectureNote } from "@/types/lecture-note"

interface NoteReaderProps {
  notes: LectureNote[]
  showLectureHeaders?: boolean
}

export function NoteReader({ notes, showLectureHeaders = true }: NoteReaderProps) {
  // Group notes by lecture for combined view
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

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No notes to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedNotes).map(([lectureTitle, lectureNotes], lectureIndex) => (
        <div key={lectureTitle} className="space-y-6">
          {showLectureHeaders && (
            <>
              {lectureIndex > 0 && <Separator className="my-8" />}
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{lectureTitle}</h2>
                <Badge variant="outline">{lectureNotes.length} notes</Badge>
              </div>
            </>
          )}
          <div className="space-y-6">
            {lectureNotes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{note.noteTitle}</CardTitle>
                    <Badge variant="secondary" className="font-mono">
                      #{note.sequence}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-neutral max-w-none dark:prose-invert">
                    {note.content.split("\n").map((paragraph, i) => (
                      <p key={i} className="mb-4 leading-relaxed last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
