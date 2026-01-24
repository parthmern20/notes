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

  const exportToPDF = () => {
    setIsExporting(true)
    // Small delay to update button state before print dialog
    setTimeout(() => {
      window.print()
      setIsExporting(false)
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between print:hidden">
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
            {isExporting ? "Preparing..." : "Export as PDF"}
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
          <div className="space-y-6 print:space-y-4">
            {notesWithSummaries.map((note, index) => (
              <Card key={note.id} className="overflow-hidden break-inside-avoid">
                <CardHeader className="bg-muted/50 print:bg-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground print:bg-black print:text-white">
                          {index + 1}
                        </span>
                        <div>
                          <CardTitle className="text-xl">{note.lectureTitle}</CardTitle>
                          <CardDescription className="mt-1 print:text-gray-600">
                            {note.noteTitle}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert print:prose-print">
                    <div className="whitespace-pre-wrap leading-relaxed text-foreground print:text-black">
                      {note.summary}
                    </div>
                  </div>
                  {note.practiceQuestions && note.practiceQuestions.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                      <h4 className="mb-4 font-semibold">Practice Questions</h4>
                      <div className="space-y-4">
                        {note.practiceQuestions.map((question, qIndex) => (
                          <div key={qIndex} className="rounded-lg bg-muted/50 p-4 print:border print:border-gray-300 print:bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium print:text-black">
                                  Q{qIndex + 1}: {question.question}
                                </p>
                                <div className="mt-3 space-y-2">
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="text-sm print:text-black">
                                      <span className="rounded bg-muted px-2 py-1 font-mono print:bg-gray-200">
                                        {String.fromCharCode(65 + oIndex)}.
                                      </span>
                                      <span className="ml-2">{option}</span>
                                      {option === question.correctAnswer && (
                                        <span className="ml-2 text-xs font-semibold text-green-600 print:text-green-800">
                                          ✓ Correct
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 print:border print:border-yellow-600">
                                {question.difficulty}
                              </div>
                            </div>
                            <div className="mt-3 border-t pt-3 text-xs text-muted-foreground print:text-gray-700">
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
      
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Hide header and buttons when printing */
          header,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Reset container for print */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          /* Page breaks */
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Ensure colors print correctly */
          .bg-muted,
          .bg-muted\\/50 {
            background-color: #f5f5f5 !important;
          }
          
          .bg-primary {
            background-color: #000 !important;
          }
          
          .text-primary-foreground {
            color: #fff !important;
          }
          
          .bg-yellow-50 {
            background-color: #fefce8 !important;
          }
          
          .text-yellow-800 {
            color: #854d0e !important;
          }
          
          .text-green-600,
          .text-green-800 {
            color: #16a34a !important;
          }
          
          /* Force black text for readability */
          .print\\:text-black {
            color: #000 !important;
          }
          
          .print\\:text-gray-600 {
            color: #525252 !important;
          }
          
          .print\\:text-gray-700 {
            color: #404040 !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f5f5f5 !important;
          }
          
          .print\\:bg-gray-50 {
            background-color: #fafafa !important;
          }
          
          .print\\:bg-gray-200 {
            background-color: #e5e5e5 !important;
          }
          
          .print\\:border {
            border-width: 1px !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d4d4d4 !important;
          }
          
          .print\\:border-yellow-600 {
            border-color: #ca8a04 !important;
          }
        }
      `}</style>
    </div>
  )
}