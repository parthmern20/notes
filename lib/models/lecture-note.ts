import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ILectureNote extends Document {
  _id: mongoose.Types.ObjectId
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  createdAt: Date
  updatedAt: Date
}

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
  },
  {
    timestamps: true,
  },
)

// Create indexes for efficient queries
LectureNoteSchema.index({ lectureTitle: 1, sequence: 1 })

export const LectureNote: Model<ILectureNote> =
  mongoose.models.LectureNote || mongoose.model<ILectureNote>("LectureNote", LectureNoteSchema)
