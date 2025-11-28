'use client'

import { useState } from 'react'

interface Question {
  id: string
  body: string
  image_url: string
  time_limit: number
  points: number
  order: number
  choices: Choice[]
}

interface Choice {
  id: string
  body: string
  is_correct: boolean
}

interface AIQuizGeneratorProps {
  onQuestionsGenerated: (questions: Question[]) => void
}

// Function to extract text from PDF using PDF.js from CDN
async function extractTextFromPDF(file: File): Promise<string> {
  // Load PDF.js from CDN if not already loaded
  if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load PDF.js'))
      document.head.appendChild(script)
    })

    // Set worker
    const pdfjsLib = (window as any).pdfjsLib
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }

  const pdfjsLib = (window as any).pdfjsLib
  if (!pdfjsLib) {
    throw new Error('PDF.js not loaded')
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
    fullText += pageText + '\n'
  }

  return fullText.trim()
}

export default function AIQuizGenerator({ onQuestionsGenerated }: AIQuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'url' | 'pdf'>('topic')
  const [topic, setTopic] = useState('')
  const [textContent, setTextContent] = useState('')
  const [url, setUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')

    try {
      let content = ''
      let type = activeTab

      // Get content based on active tab
      switch (activeTab) {
        case 'topic':
          if (!topic.trim()) {
            setError('กรุณาใส่หัวข้อ')
            setGenerating(false)
            return
          }
          content = topic
          break

        case 'text':
          if (!textContent.trim()) {
            setError('กรุณาใส่เนื้อหา')
            setGenerating(false)
            return
          }
          content = textContent
          break

        case 'url':
          if (!url.trim()) {
            setError('กรุณาใส่ URL')
            setGenerating(false)
            return
          }
          // Basic URL validation
          try {
            new URL(url)
            content = url
          } catch {
            setError('URL ไม่ถูกต้อง')
            setGenerating(false)
            return
          }
          break

        case 'pdf':
          if (!pdfFile) {
            setError('กรุณาเลือกไฟล์ PDF')
            setGenerating(false)
            return
          }
          try {
            // Extract text from PDF
            const pdfText = await extractTextFromPDF(pdfFile)
            if (!pdfText || pdfText.length < 50) {
              setError('ไม่สามารถอ่านเนื้อหาจาก PDF ได้ หรือ PDF มีเนื้อหาน้อยเกินไป')
              setGenerating(false)
              return
            }
            content = pdfText
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError)
            setError('ไม่สามารถอ่านไฟล์ PDF ได้ กรุณาลองไฟล์อื่น')
            setGenerating(false)
            return
          }
          break
      }

      // Call API to generate quiz
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          content,
          numberOfQuestions,
          difficulty,
        }),
      })

      // Parse response
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz')
      }

      if (!data.success || !data.questions) {
        throw new Error('Response ไม่ถูกต้อง ไม่พบคำถามที่สร้าง')
      }

      // Transform AI response to match our Question interface
      const generatedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        body: q.body,
        image_url: '',
        time_limit: q.time_limit || 20,
        points: q.points || 1000,
        order: index,
        choices: q.choices.map((c: any, cIndex: number) => ({
          id: `choice-${cIndex}-${Date.now()}-${index}`,
          body: c.body,
          is_correct: c.is_correct,
        })),
      }))

      // Pass generated questions to parent
      onQuestionsGenerated(generatedQuestions)

      // Close modal and reset
      setIsOpen(false)
      setTopic('')
      setTextContent('')
      setUrl('')
      setPdfFile(null)

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างคำถาม')
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition active:scale-95 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-bold text-sm sm:text-base">AI Generate Quiz</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">AI Quiz Generator</h2>
              <p className="text-purple-100 text-sm">สร้างคำถามด้วย AI ในไม่กี่วินาที</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'topic', label: 'หัวข้อ', icon: '💡' },
              { id: 'text', label: 'เนื้อหา', icon: '📝' },
              { id: 'url', label: 'URL', icon: '🔗' },
              { id: 'pdf', label: 'PDF', icon: '📄' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 'topic' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">หัวข้อที่ต้องการสร้างควิซ</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="เช่น: ประวัติศาสตร์ไทย, ภาษาอังกฤษ TOEIC, วิทยาศาสตร์ ม.3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-2">💡 AI จะสร้างคำถามตามหัวข้อที่คุณระบุ</p>
              </div>
            )}

            {activeTab === 'text' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">วางเนื้อหาที่ต้องการสร้างควิซ</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  placeholder="วางเนื้อหา เช่น บทความ, บทเรียน, หรือข้อความยาวๆ ที่ต้องการให้ AI สร้างคำถามจาก..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">📝 AI จะวิเคราะห์เนื้อหาและสร้างคำถามที่เกี่ยวข้อง</p>
              </div>
            )}

            {activeTab === 'url' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">URL ของเว็บไซต์</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/Thailand"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-sm text-gray-500 mt-2">🔗 AI จะดึงเนื้อหาจาก URL และสร้างคำถาม (ใช้ได้ดีกับ Wikipedia, บทความ)</p>
              </div>
            )}

            {activeTab === 'pdf' && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">อัปโหลดไฟล์ PDF</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-gray-700 font-medium">
                      {pdfFile ? pdfFile.name : 'คลิกเพื่อเลือกไฟล์ PDF'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">AI จะอ่านและสร้างคำถามจาก PDF</p>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">จำนวนคำถาม</label>
              <select
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={3}>3 คำถาม (เร็วที่สุด)</option>
                <option value={5}>5 คำถาม (แนะนำ)</option>
                <option value={10}>10 คำถาม</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">⚡ คำถามน้อยลง = สร้างเร็วขึ้น</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">ระดับความยาก</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="easy">ง่าย</option>
                <option value="medium">ปานกลาง</option>
                <option value="hard">ยาก</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังสร้าง...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>สร้างควิซด้วย AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
