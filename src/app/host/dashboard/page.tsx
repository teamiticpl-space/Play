'use client'

import { QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      getQuizSets()
    }
  }, [user, loading, router])

  const getQuizSets = async () => {
    if (!user?.id) return

    setLoadingQuizzes(true)
    const { data, error } = await supabase
      .from('quiz_sets')
      .select(`*, questions(*, choices(*))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setQuizSets(data || [])
    }
    setLoadingQuizzes(false)
  }

  const startGame = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: quizSetId,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('Failed to start game')
      return
    }

    window.open(`/host/game/${data.id}`, '_blank', 'noopener,noreferrer')
  }

  const duplicateQuiz = async (quizId: string, quizName: string) => {
    const newName = prompt('Enter name for the duplicated quiz:', `${quizName} (Copy)`)
    if (!newName) return

    try {
      const { data, error } = await supabase.rpc('duplicate_quiz' as any, {
        original_quiz_id: quizId,
        new_name: newName,
      })

      if (error) throw error

      alert('Quiz duplicated successfully!')
      getQuizSets()
    } catch (err: any) {
      alert('Failed to duplicate quiz: ' + err.message)
    }
  }

  const deleteQuiz = async (quizId: string, quizName: string) => {
    if (!confirm(`Are you sure you want to delete "${quizName}"? This cannot be undone.`)) {
      return
    }

    const { error } = await supabase.from('quiz_sets').delete().eq('id', quizId)

    if (error) {
      alert('Failed to delete quiz')
    } else {
      setQuizSets(quizSets.filter((q) => q.id !== quizId))
    }
  }

  if (loading || loadingQuizzes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Quizzes</h1>
          <p className="text-gray-600 mt-1">Manage and play your quiz collections</p>
        </div>

        <div className="flex gap-3">
          <div className="flex bg-white rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'} rounded-l-lg`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'} rounded-r-lg border-l`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Link
            href="/host/dashboard/create"
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Quiz
          </Link>
        </div>
      </div>

      {quizSets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No quizzes yet</h2>
          <p className="text-gray-600 mb-6">Create your first quiz to get started!</p>
          <Link
            href="/host/dashboard/create"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {quizSets.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
            >
              <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-white text-6xl">🎯</div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{quiz.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quiz.description || 'No description'}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {quiz.questions?.length || 0} questions
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startGame(quiz.id)}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => router.push(`/host/dashboard/edit/${quiz.id}`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => duplicateQuiz(quiz.id, quiz.name)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.id, quiz.name)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
