"use client"

import type { PracticeQuestion } from "@/types/lecture-note"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Sparkles, Edit2, Check, X } from "lucide-react"

interface AIContentViewerProps {
  summary?: string
  practiceQuestions?: PracticeQuestion[]
  isEditable?: boolean
  onSaveContent?: (summary: string, questions: PracticeQuestion[]) => Promise<void>
}

export function AIContentViewer({
  summary = "",
  practiceQuestions = [],
  isEditable = false,
  onSaveContent,
}: AIContentViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState(summary)
  const [editedQuestions, setEditedQuestions] = useState<PracticeQuestion[]>(practiceQuestions)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!onSaveContent) return
    setIsSaving(true)
    try {
      await onSaveContent(editedSummary, editedQuestions)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedSummary(summary)
    setEditedQuestions(practiceQuestions)
    setIsEditing(false)
  }

  const updateQuestion = (index: number, field: keyof PracticeQuestion, value: unknown) => {
    const updated = [...editedQuestions]
    ;(updated[index] as Record<string, unknown>)[field] = value
    setEditedQuestions(updated)
  }

  if (!summary && practiceQuestions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No AI-generated content yet. Click "Generate AI Content" to create a summary and practice questions.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Summary
                </CardTitle>
                <CardDescription>AI-generated summary of the lecture notes</CardDescription>
              </div>
              {isEditable && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea value={editedSummary} onChange={(e) => setEditedSummary(e.target.value)} className="min-h-40" />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Practice Questions Section */}
      {practiceQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  AWS Cloud Practitioner Questions ({practiceQuestions.length})
                </CardTitle>
                <CardDescription>AI-generated practice questions for exam preparation</CardDescription>
              </div>
              {isEditable && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {editedQuestions.map((question, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(index, "question", e.target.value)}
                        className="w-full min-h-12 rounded border bg-background p-2 text-sm"
                        placeholder="Question"
                      />
                    ) : (
                      <p className="font-medium">{question.question}</p>
                    )}
                  </div>
                  <Badge
                    variant={question.difficulty === "Difficult (imp)" ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {question.difficulty}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Options:</p>
                  <div className="space-y-2 pl-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{String.fromCharCode(65 + optIndex)}.</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const updated = [...editedQuestions]
                              updated[index].options[optIndex] = e.target.value
                              setEditedQuestions(updated)
                            }}
                            className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm">{option}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded bg-green-50 p-2 dark:bg-green-950">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-200">Correct Answer:</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                      className="w-full rounded border bg-background px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-green-700 dark:text-green-200">{question.correctAnswer}</p>
                  )}
                </div>

                <div className="space-y-2 rounded bg-blue-50 p-2 dark:bg-blue-950">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-200">Explanation:</p>
                  {isEditing ? (
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                      className="w-full min-h-20 rounded border bg-background p-2 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-blue-700 dark:text-blue-200">{question.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Mode Actions */}
      {isEditable && isEditing && (
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving && "Saving..."} {!isSaving && <Check className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
