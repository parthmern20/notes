export const typeDefs = `#graphql
  type PracticeQuestion {
    question: String!
    options: [String!]!
    correctAnswer: String!
    difficulty: String!
    explanation: String!
  }

  type LectureNote {
    id: ID!
    lectureTitle: String!
    noteTitle: String!
    content: String!
    sequence: Int!
    summary: String
    practiceQuestions: [PracticeQuestion!]
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getAllNotes: [LectureNote!]!
    getNotesByLecture(lectureTitle: String!): [LectureNote!]!
    getNoteById(id: ID!): LectureNote
    getLectureTitles: [String!]!
  }

  input PracticeQuestionInput {
    question: String!
    options: [String!]!
    correctAnswer: String!
    difficulty: String!
    explanation: String!
  }

  input CreateNoteInput {
    lectureTitle: String!
    noteTitle: String!
    content: String!
    sequence: Int!
    summary: String
    practiceQuestions: [PracticeQuestionInput!]
  }

  input UpdateNoteInput {
    noteTitle: String
    content: String
    sequence: Int
    summary: String
    practiceQuestions: [PracticeQuestionInput!]
  }

  type Mutation {
    createNote(input: CreateNoteInput!): LectureNote!
    updateNote(id: ID!, input: UpdateNoteInput!): LectureNote!
    deleteNote(id: ID!): Boolean!
    generateAIContent(id: ID!): LectureNote!
  }
`
