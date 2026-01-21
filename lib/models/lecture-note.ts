import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface PracticeQuestion {
  question: string
  options: string[]
  correctAnswer: string
  difficulty: "Difficult (imp)" | "Regular"
  explanation: string
}

export interface ILectureNote extends Document {
  _id: mongoose.Types.ObjectId
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  summary?: string
  practiceQuestions?: PracticeQuestion[]
  createdAt: Date
  updatedAt: Date
}

const PracticeQuestionSchema = new Schema<PracticeQuestion>(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Difficult (imp)", "Regular"],
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
  },
  { _id: false },
)

const LectureNoteSchema = new Schema<ILectureNote>(
  {
    lectureTitle: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },
    noteTitle: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    sequence: {
      type: Number,
      required: [true, "Sequence number is required"],
      min: 1,
    },
    summary: {
      type: String,
      default: null,
    },
    practiceQuestions: {
      type: [PracticeQuestionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for efficient queries
LectureNoteSchema.index({ lectureTitle: 1, sequence: 1 })
LectureNoteSchema.index({ createdAt: -1 })

export const LectureNote: Model<ILectureNote> =
  mongoose.models.LectureNote || mongoose.model<ILectureNote>("LectureNote", LectureNoteSchema)
