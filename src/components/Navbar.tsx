'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/host/dashboard" className="text-2xl font-bold hover:opacity-90">
            ICPG Quiz
          </Link>

          <div className="flex items-center gap-4">
            {user && !(user as any).is_anonymous && (
              <>
                <Link
                  href="/host/dashboard"
                  className="px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  My Quizzes
                </Link>
                <Link
                  href="/host/dashboard/create"
                  className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-opacity-90 transition"
                >
                  Create Quiz
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  >
                    <div className="w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b text-sm text-gray-600">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/host/dashboard/analytics"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        Analytics
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {(!user || (user as any).is_anonymous) && (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-opacity-90 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
