export interface PracticeQuestion {
  question: string
  options: string[]
  correctAnswer: string
  difficulty: "Difficult (imp)" | "Regular"
  explanation: string
}

export interface LectureNote {
  id: string
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
  createdAt: string
  updatedAt: string
}

export interface CreateNoteInput {
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
}

export interface UpdateNoteInput {
  noteTitle?: string
  content?: string
  sequence?: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
}
