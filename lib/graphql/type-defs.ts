export const typeDefs = `#graphql
  type LectureNote {
    id: ID!
    lectureTitle: String!
    noteTitle: String!
    content: String!
    sequence: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getAllNotes: [LectureNote!]!
    getNotesByLecture(lectureTitle: String!): [LectureNote!]!
    getNoteById(id: ID!): LectureNote
    getLectureTitles: [String!]!
  }

  input CreateNoteInput {
    lectureTitle: String!
    noteTitle: String!
    content: String!
    sequence: Int!
  }

  input UpdateNoteInput {
    noteTitle: String
    content: String
    sequence: Int
  }

  type Mutation {
    createNote(input: CreateNoteInput!): LectureNote!
    updateNote(id: ID!, input: UpdateNoteInput!): LectureNote!
    deleteNote(id: ID!): Boolean!
  }
`
