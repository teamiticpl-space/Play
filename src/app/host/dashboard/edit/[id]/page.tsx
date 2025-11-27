'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/types/types'
import { useRouter, useParams } from 'next/navigation'

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

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500']

export default function EditQuizPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [quizName, setQuizName] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true)
  const [autoAdvanceTime, setAutoAdvanceTime] = useState(5)
  const [isPublic, setIsPublic] = useState(true)
  const [teamMode, setTeamMode] = useState(false)
  const [maxTeams, setMaxTeams] = useState(2)
  const [autoRead, setAutoRead] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (quizId) {
      loadQuiz()
    }
  }, [quizId])

  const loadQuiz = async () => {
    setLoading(true)
    const { data, error } = await (supabase
      .from('quiz_sets')
      .select(`
        *,
        questions (
          *,
          choices (*)
        )
      `)
      .eq('id', quizId)
      .single() as any)

    if (error || !data) {
      setError('โหลดควิซไม่สำเร็จ')
      setLoading(false)
      return
    }

    // Check ownership
    if ((data as any).user_id !== user?.id) {
      alert('คุณไม่มีสิทธิ์แก้ไขควิซนี้')
      router.push('/host/dashboard')
      return
    }

    setQuizName(data.name)
    setQuizDescription(data.description || '')
    const autoAdvTime = (data as any).auto_advance_time ?? 5
    setAutoAdvanceEnabled(autoAdvTime > 0)
    setAutoAdvanceTime(autoAdvTime > 0 ? autoAdvTime : 5)
    setIsPublic(data.is_public)
    setTeamMode((data as any).team_mode ?? false)
    setMaxTeams((data as any).max_teams ?? 2)
    setAutoRead((data as any).auto_read ?? false)

    // Sort questions and choices
    const sortedQuestions = data.questions
      .sort((a: any, b: any) => a.order - b.order)
      .map((q: any) => ({
        ...q,
        choices: q.choices.sort((a: any, b: any) => {
          // Maintain original order or default order
          return 0
        }),
      }))

    setQuestions(sortedQuestions)
    setLoading(false)
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      body: '',
      image_url: '',
      time_limit: 20,
      points: 1000,
      order: questions.length,
      choices: [
        { id: `choice-1-${Date.now()}`, body: '', is_correct: true },
        { id: `choice-2-${Date.now()}`, body: '', is_correct: false },
        { id: `choice-3-${Date.now()}`, body: '', is_correct: false },
        { id: `choice-4-${Date.now()}`, body: '', is_correct: false },
      ],
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateChoice = (questionIndex: number, choiceIndex: number, field: keyof Choice, value: any) => {
    const updated = [...questions]
    updated[questionIndex].choices[choiceIndex] = {
      ...updated[questionIndex].choices[choiceIndex],
      [field]: value,
    }
    setQuestions(updated)
  }

  const setCorrectAnswer = (questionIndex: number, choiceIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].choices = updated[questionIndex].choices.map((choice, idx) => ({
      ...choice,
      is_correct: idx === choiceIndex,
    }))
    setQuestions(updated)
  }

  const deleteQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index)
    updated.forEach((q, i) => (q.order = i))
    setQuestions(updated)
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }

    const updated = [...questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    updated.forEach((q, i) => (q.order = i))
    setQuestions(updated)
  }

  const handleSave = async () => {
    if (!quizName.trim()) {
      setError('กรุณาใส่ชื่อควิซ')
      return
    }

    if (questions.length === 0) {
      setError('กรุณาเพิ่มอย่างน้อย 1 คำถาม')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.body.trim()) {
        setError(`คำถามที่ ${i + 1} ยังว่างอยู่`)
        return
      }
      if (q.choices.filter((c) => c.body.trim()).length < 2) {
        setError(`คำถามที่ ${i + 1} ต้องมีอย่างน้อย 2 ตัวเลือก`)
        return
      }
      if (!q.choices.some((c) => c.is_correct)) {
        setError(`คำถามที่ ${i + 1} ต้องมีคำตอบที่ถูกต้อง`)
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      // Update quiz set metadata
      const { error: quizError } = await supabase
        .from('quiz_sets')
        .update({
          name: quizName,
          description: quizDescription,
          auto_advance_time: autoAdvanceEnabled ? autoAdvanceTime : 0,
          is_public: isPublic,
          team_mode: teamMode,
          max_teams: teamMode ? maxTeams : 2,
          auto_read: autoRead,
        })
        .eq('id', quizId)

      if (quizError) throw quizError

      // Delete all existing questions and choices (cascade delete)
      await supabase.from('questions').delete().eq('quiz_set_id', quizId)

      // Re-add all questions
      for (const question of questions) {
        await supabase.rpc('add_question', {
          quiz_set_id: quizId,
          body: question.body,
          order: question.order,
          image_url: question.image_url || null,
          time_limit: question.time_limit,
          points: question.points,
          choices: question.choices.map((c) => ({
            body: c.body,
            is_correct: c.is_correct,
          })),
        } as any)
      }

      alert('อัปเดตควิซสำเร็จ!')
      router.push('/host/dashboard')
    } catch (err: any) {
      setError(err.message || 'บันทึกควิซไม่สำเร็จ')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">กำลังโหลดควิซ...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แก้ไขควิซ</h1>
        <p className="text-gray-600">อัปเดตคำถามและการตั้งค่าควิซของคุณ</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Quiz Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">รายละเอียดควิซ</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">ชื่อควิซ *</label>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="เช่น ควิซประวัติศาสตร์โลก"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">คำอธิบาย</label>
            <textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="คำอธิบายสั้นๆ เกี่ยวกับควิซของคุณ"
            />
          </div>

          <div className="border-t pt-4 mt-2">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="autoAdvanceEnabled"
                checked={autoAdvanceEnabled}
                onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
              />
              <label htmlFor="autoAdvanceEnabled" className="ml-2 text-gray-700 text-sm sm:text-base font-semibold">
                ⏱️ เปิดใช้งานตัวจับเวลาอัตโนมัติ
              </label>
            </div>

            {autoAdvanceEnabled && (
              <div className="ml-7 pl-3 border-l-4 border-purple-200">
                <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">
                  เวลาเลื่อนอัตโนมัติ
                </label>
                <div className="flex items-center gap-2 sm:gap-4">
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={autoAdvanceTime}
                    onChange={(e) => setAutoAdvanceTime(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="w-20 text-center flex-shrink-0">
                    <span className="text-base sm:text-lg font-bold text-purple-600">{autoAdvanceTime} วิ</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  ✨ เลื่อนไปคำถามถัดไปอัตโนมัติหลังจาก {autoAdvanceTime} วินาที
                </p>
              </div>
            )}

            {!autoAdvanceEnabled && (
              <p className="text-xs sm:text-sm text-gray-500 ml-7">
                ⚠️ โหมดแมนนวล: โฮสต์ต้องกดปุ่ม &quot;ถัดไป&quot; เพื่อดำเนินการต่อ
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="isPublic" className="ml-2 text-gray-700">
              ทำให้ควิซนี้เป็นสาธารณะ (ใครก็สามารถเล่นได้)
            </label>
          </div>

          {/* Team Mode */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="teamMode"
                checked={teamMode}
                onChange={(e) => setTeamMode(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="teamMode" className="ml-2 text-gray-700 font-semibold">
                🏆 เปิดใช้งานโหมดทีม
              </label>
            </div>

            {teamMode && (
              <div className="ml-7 pl-3 border-l-4 border-purple-200">
                <label className="block text-gray-700 font-medium mb-2">
                  จำนวนทีม
                </label>
                <select
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(parseInt(e.target.value))}
                  className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value={2}>2 ทีม</option>
                  <option value={3}>3 ทีม</option>
                  <option value={4}>4 ทีม</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  ผู้เล่นจะถูกแบ่งเป็นทีมและแข่งขันร่วมกัน
                </p>
              </div>
            )}
          </div>

          {/* Auto-Read Questions */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRead"
                checked={autoRead}
                onChange={(e) => setAutoRead(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="autoRead" className="ml-2 text-gray-700 font-semibold">
                🔊 อ่านคำถามออกเสียงอัตโนมัติ
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2 ml-7">
              AI จะอ่านคำถามแต่ละข้อออกเสียงโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">คำถาม ({questions.length})</h2>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มคำถาม
          </button>
        </div>

        {questions.map((question, qIndex) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-purple-700">คำถามที่ {qIndex + 1}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => moveQuestion(qIndex, 'up')}
                  disabled={qIndex === 0}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="เลื่อนขึ้น"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveQuestion(qIndex, 'down')}
                  disabled={qIndex === questions.length - 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="เลื่อนลง"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded"
                  title="ลบ"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">ข้อความคำถาม *</label>
                <textarea
                  value={question.body}
                  onChange={(e) => updateQuestion(qIndex, 'body', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ใส่คำถามของคุณ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">เวลาจำกัด (วินาที)</label>
                  <input
                    type="number"
                    value={question.time_limit}
                    onChange={(e) => updateQuestion(qIndex, 'time_limit', parseInt(e.target.value))}
                    min="5"
                    max="60"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">คะแนน</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Choices */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">ตัวเลือกคำตอบ *</label>
                <div className="grid grid-cols-2 gap-3">
                  {question.choices.map((choice, cIndex) => (
                    <div
                      key={choice.id}
                      className={`relative flex items-center gap-2 p-3 border-2 rounded-lg ${
                        choice.is_correct
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 ${COLORS[cIndex]} rounded flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {cIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={choice.body}
                        onChange={(e) => updateChoice(qIndex, cIndex, 'body', e.target.value)}
                        className="flex-1 px-3 py-2 border-0 bg-transparent focus:outline-none"
                        placeholder={`ตัวเลือก ${cIndex + 1}`}
                      />
                      <button
                        onClick={() => setCorrectAnswer(qIndex, cIndex)}
                        className={`px-3 py-1 text-xs font-semibold rounded ${
                          choice.is_correct
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {choice.is_correct ? '✓ ถูก' : 'ตั้งเป็นคำตอบ'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">ยังไม่มีคำถาม เริ่มเพิ่มคำถามในควิซของคุณเลย!</p>
            <button
              onClick={addQuestion}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              เพิ่มคำถามแรก
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-0 bg-white p-4 border-t shadow-lg">
        <button
          onClick={() => router.push('/host/dashboard')}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'อัปเดตควิซ'}
        </button>
      </div>
    </div>
  )
}
