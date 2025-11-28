'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex justify-between items-center">
          <Link href="/host/dashboard" className="text-xl sm:text-2xl font-bold hover:opacity-90">
            ICPG Quiz
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {user && !(user as any).is_anonymous && (
              <>
                <Link
                  href="/host/dashboard"
                  className="px-3 lg:px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-sm lg:text-base"
                >
                  ควิซของฉัน
                </Link>
                <Link
                  href="/host/dashboard/create"
                  className="px-3 lg:px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-opacity-90 transition text-sm lg:text-base"
                >
                  สร้างควิซ
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 px-2 lg:px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  >
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold text-sm lg:text-base">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50">
                      <div className="px-4 py-2 border-b text-sm text-gray-600 truncate">
                        {user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        โปรไฟล์
                      </Link>
                      <Link
                        href="/host/dashboard/analytics"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setShowMenu(false)}
                      >
                        วิเคราะห์ข้อมูล
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        ออกจากระบบ
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
                  className="px-3 lg:px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-sm lg:text-base"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 lg:px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-opacity-90 transition text-sm lg:text-base"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20">
            {user && !(user as any).is_anonymous && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm truncate flex-1">{user.email}</span>
                </div>
                <Link
                  href="/host/dashboard"
                  className="block px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ควิซของฉัน
                </Link>
                <Link
                  href="/host/dashboard/create"
                  className="block px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  สร้างควิซ
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  โปรไฟล์
                </Link>
                <Link
                  href="/host/dashboard/analytics"
                  className="block px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  วิเคราะห์ข้อมูล
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition text-red-200"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}

            {(!user || (user as any).is_anonymous) && (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-opacity-90 transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
