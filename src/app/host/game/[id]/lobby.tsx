import { Participant, QuizSet, supabase } from '@/types/types'
import { useQRCode } from 'next-qrcode'
import { useEffect, useRef, useState } from 'react'
import { playSound, playMusic, stopMusic } from '@/utils/sounds'
import SoundControl from '@/components/SoundControl'
import { AvatarDisplay } from '@/components/AvatarPicker'
import { getThemeById, DEFAULT_THEME } from '@/utils/themes'
// import HostLiveChat from '@/components/HostLiveChat' // Hidden: not ready

export default function Lobby({
  participants: allParticipants,
  gameId,
  quizSet,
}: {
  participants: Participant[]
  gameId: string
  quizSet: QuizSet
}) {
  const theme = getThemeById((quizSet as any).theme_id) || DEFAULT_THEME
  const { Canvas } = useQRCode()
  const [hostUserId, setHostUserId] = useState<string>('')
  const [musicStarted, setMusicStarted] = useState(false)
  const [isQRExpanded, setIsQRExpanded] = useState(false)

  // Filter out host from players list
  const participants = allParticipants.filter(p => (p as any).user_id !== hostUserId)
  const previousParticipantCount = useRef(participants.length)

  // Get host user ID
  useEffect(() => {
    const getHostUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setHostUserId(user.id)
      }
    }
    getHostUserId()
  }, [])

  // Start music when user clicks
  const startMusic = () => {
    if (!musicStarted) {
      playMusic('lobby')
      setMusicStarted(true)
    }
  }

  // Stop music when leaving lobby
  useEffect(() => {
    return () => {
      stopMusic()
    }
  }, [])

  useEffect(() => {
    // Play sound when new participant joins
    if (participants.length > previousParticipantCount.current) {
      playSound('join')
    }
    previousParticipantCount.current = participants.length
  }, [participants.length])

  const onClickStartGame = async () => {
    playSound('start')
    stopMusic()

    const { data, error } = await supabase
      .from('games')
      .update({ phase: 'quiz' })
      .eq('id', gameId)
    if (error) {
      return alert(error.message)
    }
  }

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/BGlobby.jpg')" }}
      onClick={startMusic}
    >
      <SoundControl />

      {/* Music button - shows until music is started */}
      {!musicStarted && (
        <button
          onClick={startMusic}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-2xl hover:from-purple-700 hover:to-pink-700 transition z-50 flex items-center gap-3 animate-bounce text-lg font-bold"
        >
          🎵 คลิกเพื่อเปิดเพลง
        </button>
      )}

      <div className="flex flex-col lg:flex-row justify-center gap-6 m-auto bg-white bg-opacity-95 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl border-2 sm:border-4 border-orange-400 w-full max-w-5xl">
        {/* Left Column: Players List */}
        <div className="w-full lg:w-80 xl:w-96">
          <h2 className="text-2xl sm:text-3xl font-bold text-orange-600 mb-4 sm:mb-6">Waiting for Players...</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 pb-6 min-h-32 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <div
                className="flex items-center gap-2 p-2 sm:p-3 bg-white rounded-lg shadow-md animate-bounce-in"
                key={participant.id}
              >
                <AvatarDisplay
                  avatarId={(participant as any).avatar_id}
                  size="sm"
                />
                <span className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  {participant.nickname}
                </span>
              </div>
            ))}
          </div>

          <div className="text-gray-700 text-center mb-4 sm:mb-6 bg-orange-100 py-3 rounded-lg">
            <p className="text-lg sm:text-xl font-semibold">
              <span className="text-2xl sm:text-3xl font-bold text-orange-600">{participants.length}</span> players joined
            </p>
          </div>

          <button
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 py-3 sm:py-4 px-8 sm:px-12 text-white font-bold text-lg sm:text-xl rounded-lg hover:from-orange-600 hover:to-yellow-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            onClick={onClickStartGame}
            disabled={participants.length === 0}
          >
            {participants.length === 0 ? 'Waiting for players...' : 'Start Game 🚀'}
          </button>
        </div>

        {/* Middle Column: QR Code */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl border-2 sm:border-4 border-yellow-400">
          <p className="text-center font-bold text-orange-600 text-lg sm:text-xl mb-3 sm:mb-4">📱 Scan to Join!</p>
          <div
            className="flex justify-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsQRExpanded(true)}
            title="คลิกเพื่อขยาย QR Code"
          >
            <Canvas
              text={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameId}`}
              options={{
                errorCorrectionLevel: 'M',
                margin: 3,
                scale: 4,
                width: typeof window !== 'undefined' && window.innerWidth < 640 ? 200 : 250,
              }}
            />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">คลิกเพื่อขยาย</p>
          <p className="text-center text-xs sm:text-sm text-gray-700 mt-2 sm:mt-3 font-semibold">
            Or go to: <span className="text-orange-600">{typeof window !== 'undefined' ? window.location.host : ''}</span>
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            Game PIN: <span className="font-mono font-bold text-orange-600">{gameId.slice(0, 6)}...</span>
          </p>
        </div>

        {/* QR Code Expanded Modal */}
        {isQRExpanded && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setIsQRExpanded(false)}
          >
            <div
              className="bg-white p-8 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center font-bold text-orange-600 text-2xl mb-6">📱 Scan to Join!</p>
              <div className="flex justify-center">
                <Canvas
                  text={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${gameId}`}
                  options={{
                    errorCorrectionLevel: 'M',
                    margin: 3,
                    scale: 4,
                    width: 400,
                  }}
                />
              </div>
              <p className="text-center text-lg text-gray-700 mt-6 font-semibold">
                Or go to: <span className="text-orange-600">{typeof window !== 'undefined' ? window.location.host : ''}</span>
              </p>
              <p className="text-center text-base text-gray-500 mt-2">
                Game PIN: <span className="font-mono font-bold text-orange-600 text-xl">{gameId.slice(0, 6)}...</span>
              </p>
              <button
                className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
                onClick={() => setIsQRExpanded(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {/* Right Column: Live Chat - Hidden: not ready */}
        {/* <div className="w-full lg:w-96 xl:w-[450px]">
          {hostUserId && (
            <HostLiveChat
              gameId={gameId}
              hostUserId={hostUserId}
            />
          )}
        </div> */}
      </div>
    </div>
  )
}
