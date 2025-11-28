'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithMicrosoft } = useAuth()

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await signInWithMicrosoft()

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Gemini_Generated_Image_7gtisd7gtisd7gti (1).png')" }}
      />

      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px]" />

      {/* Login Box */}
      <div className="relative z-10 bg-white/95 backdrop-blur-[5px] p-4 sm:p-6 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-center w-[90%] sm:w-[80%] md:w-[12cm] min-h-[280px] sm:h-auto md:h-[9cm] max-w-[450px] flex flex-col justify-center mx-4">
        <h1 className="text-[#333] mb-4 sm:mb-8 text-xl sm:text-2xl md:text-[2.2em] font-bold tracking-[2px]">
          ICPG Quiz
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-[10px] mb-4 sm:mb-5 text-left text-sm sm:text-base">
            {error}
          </div>
        )}

        <button
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className="w-full py-3 sm:py-4 px-3 sm:px-4 border-none rounded-[10px] bg-gradient-to-r from-[#6a11cb] to-[#2575fc] text-white text-base sm:text-lg md:text-[1.3em] font-bold cursor-pointer transition-all duration-300 tracking-[1px] hover:from-[#2575fc] hover:to-[#6a11cb] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Microsoft'}
        </button>

        <Link
          href="/game"
          className="block mt-4 sm:mt-6 text-[#007bff] no-underline text-sm sm:text-base transition-colors duration-200 hover:text-[#0056b3] hover:underline"
        >
          เข้าร่วมเกมในฐานะผู้เล่น
        </Link>
      </div>
    </div>
  )
}
