import { connectToDatabase } from "@/lib/mongodb"
import { LectureNote, type ILectureNote, type PracticeQuestion } from "@/lib/models/lecture-note"
import { generateSummaryAndQuestions } from "@/lib/ai-service"

interface CreateNoteInput {
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
}

interface UpdateNoteInput {
  noteTitle?: string
  content?: string
  sequence?: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
}

function formatNote(note: ILectureNote) {
  return {
    id: note._id.toString(),
    lectureTitle: note.lectureTitle,
    noteTitle: note.noteTitle,
    content: note.content,
    sequence: note.sequence,
    summary: note.summary || null,
    practiceQuestions: note.practiceQuestions || [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

export const resolvers = {
  Query: {
    getAllNotes: async () => {
      await connectToDatabase()
      const notes = await LectureNote.find({}).sort({ lectureTitle: 1, sequence: 1 })
      return notes.map(formatNote)
    },
    getNotesByLecture: async (_: unknown, { lectureTitle }: { lectureTitle: string }) => {
      await connectToDatabase()
      const notes = await LectureNote.find({ lectureTitle }).sort({ sequence: 1 })
      return notes.map(formatNote)
    },
    getNoteById: async (_: unknown, { id }: { id: string }) => {
      await connectToDatabase()
      const note = await LectureNote.findById(id)
      return note ? formatNote(note) : null
    },
    getLectureTitles: async () => {
      await connectToDatabase()
      const titles = await LectureNote.distinct("lectureTitle")
      return titles.sort()
    },
  },
  Mutation: {
    createNote: async (_: unknown, { input }: { input: CreateNoteInput }) => {
      await connectToDatabase()
      const note = await LectureNote.create(input)
      return formatNote(note)
    },
    updateNote: async (_: unknown, { id, input }: { id: string; input: UpdateNoteInput }) => {
      await connectToDatabase()
      const note = await LectureNote.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true })
      if (!note) {
        throw new Error("Note not found")
      }
      return formatNote(note)
    },
    deleteNote: async (_: unknown, { id }: { id: string }) => {
      await connectToDatabase()
      const result = await LectureNote.findByIdAndDelete(id)
      return !!result
    },
    generateAIContent: async (_: unknown, { id }: { id: string }) => {
      await connectToDatabase()
      const note = await LectureNote.findById(id)
      if (!note) {
        throw new Error("Note not found")
      }

      try {
        console.log("[v0] Generating AI content for note:", note.noteTitle)
        const aiContent = await generateSummaryAndQuestions(note.noteTitle, note.content)
        note.summary = aiContent.summary
        note.practiceQuestions = aiContent.practiceQuestions
        await note.save()
        console.log("[v0] AI content generated and saved successfully")
        return formatNote(note)
      } catch (error) {
        console.error("[v0] Error generating AI content:", error)
        throw new Error(`Failed to generate AI content: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    },
  },
}
