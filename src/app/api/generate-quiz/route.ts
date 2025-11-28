import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - do not pre-render at build time
export const dynamic = 'force-dynamic'
// Use edge runtime for longer timeout on Netlify (30s vs 10s for nodejs)
export const runtime = 'edge'
export const maxDuration = 30

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

// Fetch and parse content from URL (Edge-compatible without cheerio)
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })
    const html = await response.text()

    // Simple HTML to text conversion without cheerio (Edge-compatible)
    let text = html
      // Remove script and style tags with their content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove nav, footer, header, aside tags
      .replace(/<(nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi, '')
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()

    return text.slice(0, 10000) // Limit to 10k chars
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error}`)
  }
}

// Generate quiz using OpenRouter with Gemini Flash 2.5
async function generateQuiz(request: GenerateQuizRequest): Promise<QuizQuestion[]> {
  // Allow up to 10 questions
  const { type, content, numberOfQuestions = 5, difficulty = 'medium' } = request
  const actualQuestions = Math.min(numberOfQuestions, 10)

  let promptContent = ''

  switch (type) {
    case 'topic':
      promptContent = `Create a quiz about: ${content}`
      break

    case 'text':
      // Limit content to 4000 chars for faster processing
      promptContent = `Create a quiz based on the following content:\n\n${content.slice(0, 4000)}`
      break

    case 'url':
      const urlContent = await fetchUrlContent(content)
      // URL content already limited to 10k, slice to 4k for prompt
      promptContent = `Create a quiz based on the content from this URL (${content}):\n\n${urlContent.slice(0, 4000)}`
      break

    case 'pdf':
      // PDF content is already extracted and passed in content - limit to 4000 chars
      promptContent = `Create a quiz based on the following PDF content:\n\n${content.slice(0, 4000)}`
      break
  }

  const systemPrompt = `You are an expert quiz creator. Create engaging, educational quiz questions.

Instructions:
1. Generate exactly ${actualQuestions} multiple-choice questions
2. Each question should have exactly 4 answer choices
3. Mark exactly ONE choice as correct
4. Make questions ${difficulty} difficulty level
5. Questions should be clear, specific, and educational
6. Avoid ambiguous or trick questions
7. Provide a brief explanation for the correct answer
8. Set appropriate time limits (10-30 seconds) and points (500-2000) based on difficulty

IMPORTANT - LANGUAGE:
- **Detect the language of the source content**
- **Create ALL questions, choices, and explanations in the SAME LANGUAGE as the source content**
- If content is in Thai (ภาษาไทย), write questions in Thai
- If content is in English, write questions in English
- If content is in other languages, match that language
- DO NOT translate or change the language

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
    // Call OpenRouter API with Gemini Flash 2.5
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://icpg-quiz.netlify.app',
        'X-Title': 'ICPG Quiz Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Gemini 2.5 Flash - fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent },
        ],
        temperature: 0.7,
        max_tokens: actualQuestions * 400 + 200,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API Error:', response.status, errorData)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content?.trim() || '[]'

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
    console.error('OpenRouter API Error:', error)
    throw new Error(`Failed to generate quiz: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.'
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
