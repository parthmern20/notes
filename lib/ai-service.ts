import OpenAI from "openai"

export interface PracticeQuestion {
  question: string
  options: string[]
  correctAnswer: string
  difficulty: "Difficult (imp)" | "Regular"
  explanation: string
}

export interface AIGeneratedContent {
  summary: string
  practiceQuestions: PracticeQuestion[]
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateSummaryAndQuestions(
  noteTitle: string,
  noteContent: string,
): Promise<AIGeneratedContent> {
  try {
    console.log("[v0] Starting AI generation for note:", noteTitle)

    // Generate summary
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content summarizer. Create a concise, clear summary of the provided lecture notes in a bullet point format.",
        },
        {
          role: "user",
          content: `Please summarize these lecture notes:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const summary = summaryResponse.choices[0]?.message?.content || ""
    console.log("[v0] Generated summary")

    // Generate practice questions for AWS Cloud Practitioner exam
    const questionsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AWS Cloud Practitioner exam expert. Generate 4 multiple-choice questions based on the provided content. 
For each question, include:
- question: The question text
- options: Array of 4 answer options
- correctAnswer: The correct answer text (must match one of the options)
- difficulty: Either "Difficult (imp)" for important/difficult questions or "Regular" for regular questions
- explanation: Brief explanation of the answer

Return ONLY valid JSON in this format:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctAnswer": "...",
    "difficulty": "Regular" or "Difficult (imp)",
    "explanation": "..."
  }
]`,
        },
        {
          role: "user",
          content: `Generate AWS Cloud Practitioner practice questions from these notes:\n\nTitle: ${noteTitle}\n\nContent:\n${noteContent}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    let practiceQuestions: PracticeQuestion[] = []
    const questionsContent = questionsResponse.choices[0]?.message?.content || "[]"

    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = questionsContent.match(/\[[\s\S]*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : questionsContent
      practiceQuestions = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("[v0] Failed to parse questions JSON:", parseError)
      practiceQuestions = []
    }

    console.log("[v0] Generated", practiceQuestions.length, "practice questions")

    return {
      summary,
      practiceQuestions,
    }
  } catch (error) {
    console.error("[v0] Error generating content:", error)
    throw error
  }
}
