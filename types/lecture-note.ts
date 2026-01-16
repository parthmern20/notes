export interface LectureNote {
  id: string
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
  createdAt: string
  updatedAt: string
}

export interface CreateNoteInput {
  lectureTitle: string
  noteTitle: string
  content: string
  sequence: number
}

export interface UpdateNoteInput {
  noteTitle?: string
  content?: string
  sequence?: number
}
