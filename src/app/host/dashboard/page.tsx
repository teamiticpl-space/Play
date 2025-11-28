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
    // First, get the quiz set details to copy team mode settings
    const { data: quizSet, error: quizError } = await supabase
      .from('quiz_sets')
      .select('team_mode, max_teams')
      .eq('id', quizSetId)
      .single()

    if (quizError) {
      console.error(quizError)
      alert('โหลดการตั้งค่าควิซไม่สำเร็จ')
      return
    }

    // Create game with team mode settings from quiz set
    const { data, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: quizSetId,
        team_mode: (quizSet as any).team_mode || false,
        max_teams: (quizSet as any).max_teams || 2,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      alert('เริ่มเกมไม่สำเร็จ')
      return
    }

    window.open(`/host/game/${data.id}`, '_blank', 'noopener,noreferrer')
  }

  const duplicateQuiz = async (quizId: string, quizName: string) => {
    const newName = prompt('ใส่ชื่อสำหรับควิซที่ทำสำเนา:', `${quizName} (สำเนา)`)
    if (!newName) return

    try {
      const { data, error } = await supabase.rpc('duplicate_quiz' as any, {
        original_quiz_id: quizId,
        new_name: newName,
      })

      if (error) throw error

      alert('ทำสำเนาควิซสำเร็จ!')
      getQuizSets()
    } catch (err: any) {
      alert('ทำสำเนาควิซไม่สำเร็จ: ' + err.message)
    }
  }

  const deleteQuiz = async (quizId: string, quizName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${quizName}"? การดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return
    }

    const { error } = await supabase.from('quiz_sets').delete().eq('id', quizId)

    if (error) {
      alert('ลบควิซไม่สำเร็จ')
    } else {
      setQuizSets(quizSets.filter((q) => q.id !== quizId))
    }
  }

  if (loading || loadingQuizzes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">ควิซของฉัน</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">จัดการและสร้างควิซของคุณ</p>
        </div>

        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex bg-white rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'} rounded-l-lg`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 sm:px-4 py-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'} rounded-r-lg border-l`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <Link
            href="/host/dashboard/create"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">สร้างควิซ</span>
            <span className="xs:hidden">สร้าง</span>
          </Link>
        </div>
      </div>

      {quizSets.length === 0 ? (
        <div className="text-center py-8 sm:py-16 bg-white rounded-lg shadow-md mx-2 sm:mx-0">
          <div className="text-4xl sm:text-6xl mb-4">📝</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">ยังไม่มีควิซ</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">สร้างควิซแรกของคุณเพื่อเริ่มต้น!</p>
          <Link
            href="/host/dashboard/create"
            className="inline-block bg-purple-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition font-semibold text-sm sm:text-base"
          >
            สร้างควิซแรกของคุณ
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
          {quizSets.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
            >
              <div className="h-28 sm:h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <div className="text-white text-4xl sm:text-6xl">🎯</div>
              </div>

              <div className="p-3 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2 truncate">{quiz.name}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{quiz.description || 'ไม่มีคำอธิบาย'}</p>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {quiz.questions?.length || 0} คำถาม
                  </span>
                </div>

                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => startGame(quiz.id)}
                    className="flex-1 bg-green-500 text-white py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg hover:bg-green-600 transition font-semibold text-sm sm:text-base"
                  >
                    เล่น
                  </button>
                  <button
                    onClick={() => router.push(`/host/dashboard/edit/${quiz.id}`)}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => duplicateQuiz(quiz.id, quiz.name)}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition hidden sm:block"
                    title="ทำสำเนา"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.id, quiz.name)}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm sm:text-base"
                    title="ลบ"
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
