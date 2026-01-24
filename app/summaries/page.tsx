"use client"

import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { graphqlClient, GET_ALL_NOTES } from "@/lib/graphql/client"
import type { LectureNote } from "@/types/lecture-note"
import { Download, FileText } from "lucide-react"

interface NotesResponse {
  getAllNotes: LectureNote[]
}

export default function SummariesPage() {
  const { data, isLoading } = useSWR<NotesResponse>("getAllNotes", () =>
    graphqlClient<NotesResponse>(GET_ALL_NOTES),
  )

  const [isExporting, setIsExporting] = useState(false)

  const notes = data?.getAllNotes || []
  const notesWithSummaries = notes.filter((note) => note.summary)

  const exportToPDF = async () => {
    try {
      setIsExporting(true)
      // Dynamically import html2pdf to avoid server-side issues
      const html2pdf = (await import("html2pdf.js")).default

      const element = document.getElementById("summaries-content")
      if (!element) {
        throw new Error("Content element not found")
      }

      const opt : any= {
        margin: 10,
        filename: "lecture-summaries.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error("[v0] Error exporting PDF:", error)
      alert("Failed to export PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lecture Summaries</h1>
            <p className="mt-2 text-muted-foreground">
              View and export all AI-generated summaries from your lecture notes.
            </p>
          </div>
          <Button
            onClick={exportToPDF}
            disabled={isExporting || notesWithSummaries.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export as PDF"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : notesWithSummaries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Summaries Yet</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Generate summaries for your lecture notes to see them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div id="summaries-content" className="space-y-6">
            {notesWithSummaries.map((note, index) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <CardTitle className="text-xl">{note.lectureTitle}</CardTitle>
                          <CardDescription className="mt-1">{note.noteTitle}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {note.summary}
                    </div>
                  </div>
                  {note.practiceQuestions && note.practiceQuestions.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="mb-4 font-semibold">Practice Questions</h4>
                      <div className="space-y-4">
                        {note.practiceQuestions.map((question, qIndex) => (
                          <div key={qIndex} className="rounded-lg bg-muted/50 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium">
                                  Q{qIndex + 1}: {question.question}
                                </p>
                                <div className="mt-3 space-y-2">
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="text-sm">
                                      <span className="rounded bg-muted px-2 py-1 font-mono">
                                        {String.fromCharCode(65 + oIndex)}.
                                      </span>
                                      <span className="ml-2">{option}</span>
                                      {option === question.correctAnswer && (
                                        <span className="ml-2 text-xs font-semibold text-green-600 dark:text-green-400">
                                          ✓ Correct
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                {question.difficulty}
                              </div>
                            </div>
                            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                              <p className="font-semibold">Explanation:</p>
                              <p className="mt-1">{question.explanation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}