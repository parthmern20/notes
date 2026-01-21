interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

export async function graphqlClient<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result.data as T
}

// GraphQL Queries
export const GET_ALL_NOTES = `
  query GetAllNotes {
    getAllNotes {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_NOTES_BY_LECTURE = `
  query GetNotesByLecture($lectureTitle: String!) {
    getNotesByLecture(lectureTitle: $lectureTitle) {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_NOTE_BY_ID = `
  query GetNoteById($id: ID!) {
    getNoteById(id: $id) {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_LECTURE_TITLES = `
  query GetLectureTitles {
    getLectureTitles
  }
`

// GraphQL Mutations
export const CREATE_NOTE = `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_NOTE = `
  mutation UpdateNote($id: ID!, $input: UpdateNoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`

export const DELETE_NOTE = `
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`

export const GENERATE_AI_CONTENT = `
  mutation GenerateAIContent($id: ID!) {
    generateAIContent(id: $id) {
      id
      lectureTitle
      noteTitle
      content
      sequence
      summary
      practiceQuestions {
        question
        options
        correctAnswer
        difficulty
        explanation
      }
      createdAt
      updatedAt
    }
  }
`
