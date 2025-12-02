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

interface GameSession {
  id: string
  created_at: string
  phase: string
}

interface PlayerRanking {
  participant_id: string
  nickname: string
  total_score: number
  correct_answers: number
  total_questions: number
  rank: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics[]>([])
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([])
  const [gameSessions, setGameSessions] = useState<GameSession[]>([])
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<PlayerRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (selectedQuiz) {
      loadQuestionAnalytics(selectedQuiz)
      loadGameSessions(selectedQuiz)
    }
  }, [selectedQuiz])

  useEffect(() => {
    if (selectedGame) {
      loadLeaderboard(selectedGame)
    }
  }, [selectedGame])

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

    const userAnalytics = (analyticsData as any)?.filter((a: any) =>
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

    setQuestionAnalytics((data as any) || [])
  }

  const loadGameSessions = async (quizId: string) => {
    const { data } = await supabase
      .from('games')
      .select('id, created_at, phase')
      .eq('quiz_set_id', quizId)
      .order('created_at', { ascending: false })

    setGameSessions((data as GameSession[]) || [])
    // Auto-select first game if available
    if (data && data.length > 0) {
      setSelectedGame(data[0].id)
    } else {
      setSelectedGame(null)
      setLeaderboard([])
    }
  }

  const loadLeaderboard = async (gameId: string) => {
    const { data } = await supabase
      .from('game_results')
      .select('*')
      .eq('game_id', gameId)
      .order('total_score', { ascending: false })

    // Get total questions count for this game
    const { data: gameData } = await supabase
      .from('games')
      .select('quiz_set_id')
      .eq('id', gameId)
      .single()

    let totalQuestions = 0
    if (gameData?.quiz_set_id) {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_set_id', gameData.quiz_set_id)
      totalQuestions = count || 0
    }

    // Get correct answers count for each participant
    const rankedData: PlayerRanking[] = await Promise.all(
      (data || []).map(async (player: any, index: number) => {
        // Count correct answers for this participant
        const { data: answersData } = await supabase
          .from('answers')
          .select('choice_id, choices!inner(is_correct)')
          .eq('participant_id', player.participant_id)

        const correctCount = (answersData || []).filter(
          (a: any) => a.choices?.is_correct === true
        ).length

        return {
          participant_id: player.participant_id,
          nickname: player.nickname,
          total_score: player.total_score || 0,
          correct_answers: correctCount,
          total_questions: totalQuestions,
          rank: index + 1,
        }
      })
    )

    setLeaderboard(rankedData)
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

  const exportToExcel = () => {
    if (leaderboard.length === 0) return

    // Get selected game info for filename
    const selectedGameInfo = gameSessions.find(g => g.id === selectedGame)
    const gameDate = selectedGameInfo
      ? new Date(selectedGameInfo.created_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-')
      : 'export'

    // Create CSV content
    const headers = ['ลำดับ', 'ชื่อผู้เล่น', 'ตอบถูก', 'คะแนนรวม']
    const rows = leaderboard.map(player => [
      player.rank,
      player.nickname,
      `${player.correct_answers}/${player.total_questions}`,
      player.total_score
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Add BOM for Thai character support in Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leaderboard_${gameDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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

      {/* Player Leaderboard */}
      {selectedQuiz && gameSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">ลำดับคะแนนผู้เล่น</h2>
            {leaderboard.length > 0 && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            )}
          </div>

          {/* Game Session Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">เลือกเกม:</label>
            <select
              value={selectedGame || ''}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {gameSessions.map((game, index) => (
                <option key={game.id} value={game.id}>
                  เกมที่ {gameSessions.length - index} - {new Date(game.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Leaderboard Table */}
          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-20">ลำดับ</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ชื่อผู้เล่น</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">ตอบถูก</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">คะแนนรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((player) => (
                    <tr key={player.participant_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        {player.rank === 1 && (
                          <span className="text-2xl">🥇</span>
                        )}
                        {player.rank === 2 && (
                          <span className="text-2xl">🥈</span>
                        )}
                        {player.rank === 3 && (
                          <span className="text-2xl">🥉</span>
                        )}
                        {player.rank > 3 && (
                          <span className="text-lg font-bold text-gray-600">{player.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{player.nickname}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium text-sm">
                          {player.correct_answers}/{player.total_questions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                          {player.total_score.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลผู้เล่นในเกมนี้</p>
          )}
        </div>
      )}
    </div>
  )
}
