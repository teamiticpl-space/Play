import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import * as cheerio from 'cheerio'

// Force dynamic rendering - do not pre-render at build time
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateQuizRequest {
  type: 'topic' | 'text' | 'url' | 'pdf'
  content: string
  numberOfQuestions?: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

interface QuizQuestion {
  body: string
  choices: {
    body: string
    is_correct: boolean
  }[]
  time_limit: number
  points: number
  explanation?: string
}

// Fetch and parse content from URL
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, header, aside').remove()

    // Get main content text
    const text = $('body').text().trim().replace(/\s+/g, ' ').slice(0, 10000) // Limit to 10k chars
    return text
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error}`)
  }
}

// Generate quiz using OpenAI
async function generateQuiz(request: GenerateQuizRequest): Promise<QuizQuestion[]> {
  const { type, content, numberOfQuestions = 10, difficulty = 'medium' } = request

  let promptContent = ''

  switch (type) {
    case 'topic':
      promptContent = `Create a quiz about: ${content}`
      break

    case 'text':
      promptContent = `Create a quiz based on the following content:\n\n${content.slice(0, 8000)}`
      break

    case 'url':
      const urlContent = await fetchUrlContent(content)
      promptContent = `Create a quiz based on the content from this URL (${content}):\n\n${urlContent}`
      break

    case 'pdf':
      // PDF content is already extracted and passed in content
      promptContent = `Create a quiz based on the following PDF content:\n\n${content.slice(0, 8000)}`
      break
  }

  const systemPrompt = `You are an expert quiz creator. Create engaging, educational quiz questions.

Instructions:
1. Generate exactly ${numberOfQuestions} multiple-choice questions
2. Each question should have exactly 4 answer choices
3. Mark exactly ONE choice as correct
4. Make questions ${difficulty} difficulty level
5. Questions should be clear, specific, and educational
6. Avoid ambiguous or trick questions
7. Provide a brief explanation for the correct answer
8. Set appropriate time limits (10-30 seconds) and points (500-2000) based on difficulty

Return ONLY a valid JSON array with this exact structure:
[
  {
    "body": "Question text here?",
    "choices": [
      {"body": "Choice 1", "is_correct": false},
      {"body": "Choice 2", "is_correct": true},
      {"body": "Choice 3", "is_correct": false},
      {"body": "Choice 4", "is_correct": false}
    ],
    "time_limit": 20,
    "points": 1000,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Do not include any markdown formatting, code blocks, or extra text. Return ONLY the JSON array.`

  try {
    // Adjust max_tokens based on number of questions to stay within Netlify timeout (10s)
    const estimatedTokens = Math.min(numberOfQuestions * 300 + 500, 2500)

    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency (can change to gpt-4 for better quality)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent },
        ],
        temperature: 0.7,
        max_tokens: estimatedTokens,
      },
      {
        timeout: 8000, // 8 seconds to stay within Netlify's 10s limit
      }
    )

    const responseText = completion.choices[0].message.content?.trim() || '[]'

    // Try to extract JSON if it's wrapped in markdown code blocks
    let jsonText = responseText
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/)
      if (match) {
        jsonText = match[1]
      }
    }

    const questions: QuizQuestion[] = JSON.parse(jsonText)

    // Validate the response
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from AI')
    }

    // Validate each question
    questions.forEach((q, index) => {
      if (!q.body || !q.choices || q.choices.length !== 4) {
        throw new Error(`Invalid question format at index ${index}`)
      }
      const correctCount = q.choices.filter(c => c.is_correct).length
      if (correctCount !== 1) {
        throw new Error(`Question ${index + 1} must have exactly one correct answer`)
      }
    })

    return questions

  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    throw new Error(`Failed to generate quiz: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.'
        },
        { status: 500 }
      )
    }

    // Parse request body
    let body: GenerateQuizRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate request
    if (!body.type || !body.content) {
      console.error('Missing required fields:', { type: body.type, hasContent: !!body.content })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type and content' },
        { status: 400 }
      )
    }

    console.log('Generating quiz:', { type: body.type, questions: body.numberOfQuestions, difficulty: body.difficulty })

    // Generate quiz
    const questions = await generateQuiz(body)

    console.log('Successfully generated quiz:', questions.length, 'questions')

    return NextResponse.json({
      success: true,
      questions,
      message: `Successfully generated ${questions.length} questions`,
    })

  } catch (error: any) {
    console.error('Generate Quiz Error:', error)
    // Always return valid JSON even on error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate quiz',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
