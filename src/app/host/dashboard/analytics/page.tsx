'use client'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/types/types'
import { useEffect, useState } from 'react'

interface QuizAnalytics {
  quiz_set_id: string
  quiz_name: string
  total_games: number
  total_players: number
  avg_score: number
}

interface QuestionAnalytics {
  question_id: string
  body: string
  quiz_set_id: string
  total_answers: number
  correct_answers: number
  correct_percentage: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics[]>([])
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (selectedQuiz) {
      loadQuestionAnalytics(selectedQuiz)
    }
  }, [selectedQuiz])

  const loadData = async () => {
    if (!user?.id) return

    setLoading(true)

    // Load user's quizzes
    const { data: quizzesData } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('user_id', user.id)

    setQuizzes(quizzesData || [])

    // Load quiz analytics
    const { data: analyticsData } = await supabase
      .from('quiz_analytics' as any)
      .select('*')

    const userAnalytics = analyticsData?.filter((a) =>
      quizzesData?.some((q) => q.id === a.quiz_set_id)
    )

    setQuizAnalytics(userAnalytics || [])
    setLoading(false)
  }

  const loadQuestionAnalytics = async (quizId: string) => {
    const { data } = await supabase
      .from('question_analytics' as any)
      .select('*')
      .eq('quiz_set_id', quizId)

    setQuestionAnalytics(data || [])
  }

  const getTotalPlays = () => {
    return quizAnalytics.reduce((sum, q) => sum + (q.total_games || 0), 0)
  }

  const getTotalPlayers = () => {
    return quizAnalytics.reduce((sum, q) => sum + (q.total_players || 0), 0)
  }

  const getAverageScore = () => {
    const scores = quizAnalytics.filter((q) => q.avg_score).map((q) => q.avg_score)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track performance and engagement across your quizzes</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-800">{quizzes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Plays</p>
              <p className="text-2xl font-bold text-gray-800">{getTotalPlays()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Players</p>
              <p className="text-2xl font-bold text-gray-800">{getTotalPlayers()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg Score</p>
              <p className="text-2xl font-bold text-gray-800">{getAverageScore()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Performance */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quiz Performance</h2>

        {quizAnalytics.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No game data yet. Start a game to see analytics!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quiz Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Games Played</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total Players</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Avg Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizAnalytics.map((quiz) => (
                  <tr key={quiz.quiz_set_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{quiz.quiz_name}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{quiz.total_games || 0}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{quiz.total_players || 0}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {quiz.avg_score ? Math.round(quiz.avg_score) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedQuiz(quiz.quiz_set_id)}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Question Analytics */}
      {selectedQuiz && questionAnalytics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Question Performance</h2>
            <button
              onClick={() => setSelectedQuiz(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕ Close
            </button>
          </div>

          <div className="space-y-4">
            {questionAnalytics.map((q, index) => (
              <div key={q.question_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Q{index + 1}. {q.body}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    q.correct_percentage >= 70
                      ? 'bg-green-100 text-green-700'
                      : q.correct_percentage >= 40
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {q.correct_percentage || 0}% Correct
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{q.total_answers} answers</span>
                  <span>•</span>
                  <span>{q.correct_answers} correct</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${q.correct_percentage || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
