'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2"
        title={language === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
      >
        <span className="text-lg">{language === 'en' ? '🇹🇭' : '🇬🇧'}</span>
        <span className="text-sm">{language === 'en' ? 'TH' : 'EN'}</span>
      </button>
    </div>
  )
}
