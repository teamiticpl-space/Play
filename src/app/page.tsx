'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !(user as any).is_anonymous) {
      router.push('/host/dashboard')
    }
  }, [user, loading, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6">ICPG Quiz</h1>
          <p className="text-2xl mb-8 opacity-90">
            Create engaging quizzes and play live with your audience
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="bg-purple-800 bg-opacity-50 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-70 transition border-2 border-white"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-3">Create Quizzes</h3>
            <p className="opacity-90">
              Build engaging quizzes with our easy-to-use editor. Add images, set time limits, and customize points.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold mb-3">Play Live</h3>
            <p className="opacity-90">
              Host live quiz games with real-time scoring. Players join with a simple code or QR scan.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-3">Track Analytics</h3>
            <p className="opacity-90">
              Monitor performance with detailed analytics. See which questions work best and track player progress.
            </p>
          </div>
        </div>

        {/* Quick Play */}
        <div className="mt-20 text-center bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Join a Game</h2>
          <p className="text-white opacity-90 mb-6">
            Have a game code? Join as a guest player now!
          </p>
          <Link
            href="/game"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition shadow-xl"
          >
            Join Game
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-white py-8 opacity-75">
        <p>Powered by Supabase • Open Source Kahoot Alternative</p>
      </footer>
    </main>
  )
}
