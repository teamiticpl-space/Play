'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/types/types'
import { useRouter } from 'next/navigation'
import ThemePicker from '@/components/ThemePicker'
import AIQuizGenerator from '@/components/AIQuizGenerator'

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

export default function CreateQuizPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [quizName, setQuizName] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [themeId, setThemeId] = useState('classic')
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true)
  const [autoAdvanceTime, setAutoAdvanceTime] = useState(5)
  const [isPublic, setIsPublic] = useState(true)
  const [teamMode, setTeamMode] = useState(false)
  const [maxTeams, setMaxTeams] = useState(2)
  const [autoRead, setAutoRead] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const handleAIQuestionsGenerated = (aiQuestions: Question[]) => {
    // Add AI-generated questions to existing questions
    const startOrder = questions.length
    const questionsWithOrder = aiQuestions.map((q, index) => ({
      ...q,
      order: startOrder + index,
    }))
    setQuestions([...questions, ...questionsWithOrder])
  }

  const handleSave = async () => {
    if (!quizName.trim()) {
      setError('Quiz name is required')
      return
    }

    if (questions.length === 0) {
      setError('Add at least one question')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.body.trim()) {
        setError(`Question ${i + 1} is empty`)
        return
      }
      if (q.choices.filter((c) => c.body.trim()).length < 2) {
        setError(`Question ${i + 1} needs at least 2 choices`)
        return
      }
      if (!q.choices.some((c) => c.is_correct)) {
        setError(`Question ${i + 1} needs a correct answer`)
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      // Ensure user is authenticated
      if (!user?.id) {
        setError('You must be logged in to create a quiz')
        return
      }

      // Create quiz set
      const { data: quizSet, error: quizError } = await supabase
        .from('quiz_sets')
        .insert({
          name: quizName,
          description: quizDescription,
          user_id: user.id,
          auto_advance_time: autoAdvanceEnabled ? autoAdvanceTime : 0,
          is_public: isPublic,
          theme_id: themeId,
          team_mode: teamMode,
          max_teams: teamMode ? maxTeams : 2,
          auto_read: autoRead,
        })
        .select()
        .single()

      if (quizError) throw quizError

      // Add questions
      for (const question of questions) {
        await supabase.rpc('add_question', {
          quiz_set_id: quizSet.id,
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

      router.push('/host/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create New Quiz</h1>
        <p className="text-sm sm:text-base text-gray-600">Design engaging quizzes for your audience</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Quiz Details */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Quiz Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Quiz Name *</label>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., World History Quiz"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Description</label>
            <textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Brief description of your quiz"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Theme</label>
            <ThemePicker
              selectedThemeId={themeId}
              onSelect={setThemeId}
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
                ⏱️ Enable Auto-Advance Timer
              </label>
            </div>

            {autoAdvanceEnabled && (
              <div className="ml-7 pl-3 border-l-4 border-purple-200">
                <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">
                  Auto-Advance Time
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
                    <span className="text-base sm:text-lg font-bold text-purple-600">{autoAdvanceTime}s</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  ✨ Auto-advance to next question after {autoAdvanceTime} seconds
                </p>
              </div>
            )}

            {!autoAdvanceEnabled && (
              <p className="text-xs sm:text-sm text-gray-500 ml-7">
                ⚠️ Manual mode: Host will need to click &quot;Next&quot; button to continue
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
            />
            <label htmlFor="isPublic" className="ml-2 text-gray-700 text-sm sm:text-base">
              Make this quiz public (anyone can play)
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
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
              />
              <label htmlFor="teamMode" className="ml-2 text-gray-700 text-sm sm:text-base font-semibold">
                🏆 Enable Team Mode
              </label>
            </div>

            {teamMode && (
              <div className="ml-7 pl-3 border-l-4 border-purple-200">
                <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">
                  Number of Teams
                </label>
                <select
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(parseInt(e.target.value))}
                  className="w-full sm:w-48 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value={2}>2 Teams</option>
                  <option value={3}>3 Teams</option>
                  <option value={4}>4 Teams</option>
                </select>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Players will be divided into teams and compete together
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
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
              />
              <label htmlFor="autoRead" className="ml-2 text-gray-700 text-sm sm:text-base font-semibold">
                🔊 Auto-Read Questions Aloud
              </label>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 ml-7">
              AI will automatically read each question aloud using text-to-speech
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-bold">Questions ({questions.length})</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <AIQuizGenerator onQuestionsGenerated={handleAIQuestionsGenerated} />
            <button
              onClick={addQuestion}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition active:scale-95"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm sm:text-base">Add Question</span>
            </button>
          </div>
        </div>

        {questions.map((question, qIndex) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-purple-700">Question {qIndex + 1}</h3>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => moveQuestion(qIndex, 'up')}
                  disabled={qIndex === 0}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveQuestion(qIndex, 'down')}
                  disabled={qIndex === questions.length - 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteQuestion(qIndex)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Question Text *</label>
                <textarea
                  value={question.body}
                  onChange={(e) => updateQuestion(qIndex, 'body', e.target.value)}
                  rows={2}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your question..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Time Limit (seconds)</label>
                  <input
                    type="number"
                    value={question.time_limit}
                    onChange={(e) => updateQuestion(qIndex, 'time_limit', parseInt(e.target.value))}
                    min="5"
                    max="60"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                    min="100"
                    max="5000"
                    step="100"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Choices */}
              <div>
                <label className="block text-gray-700 text-sm sm:text-base font-medium mb-2">Answer Choices *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {question.choices.map((choice, cIndex) => (
                    <div
                      key={choice.id}
                      className={`relative flex items-center gap-2 p-2 sm:p-3 border-2 rounded-lg ${
                        choice.is_correct
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 ${COLORS[cIndex]} rounded flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0`}>
                        {cIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={choice.body}
                        onChange={(e) => updateChoice(qIndex, cIndex, 'body', e.target.value)}
                        className="flex-1 px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base border-0 bg-transparent focus:outline-none"
                        placeholder={`Choice ${cIndex + 1}`}
                      />
                      <button
                        onClick={() => setCorrectAnswer(qIndex, cIndex)}
                        className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded flex-shrink-0 ${
                          choice.is_correct
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {choice.is_correct ? '✓' : 'Set'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4 text-sm sm:text-base">No questions yet. Start adding questions to your quiz!</p>
            <button
              onClick={addQuestion}
              className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-purple-700 transition active:scale-95"
            >
              Add First Question
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end sticky bottom-0 bg-white p-4 border-t shadow-lg">
        <button
          onClick={() => router.push('/host/dashboard')}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition active:scale-95"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>
    </div>
  )
}
