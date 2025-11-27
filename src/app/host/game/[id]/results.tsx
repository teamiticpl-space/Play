import {
  Answer,
  GameResult,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import { AvatarDisplay } from '@/components/AvatarPicker'
import { getThemeById, DEFAULT_THEME } from '@/utils/themes'

export default function Results({
  quizSet,
  gameId,
}: {
  participants: Participant[]
  quizSet: QuizSet
  gameId: string
}) {
  const theme = getThemeById((quizSet as any).theme_id) || DEFAULT_THEME
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [hostUserId, setHostUserId] = useState<string>('')

  const { width, height } = useWindowSize()

  useEffect(() => {
    // Get host user ID
    const getHostUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setHostUserId(user.id)
      }
    }
    getHostUserId()
  }, [])

  useEffect(() => {
    const getResults = async () => {
      // Fetch game results
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })
      if (error) {
        return alert(error.message)
      }

      // Fetch participants with avatars
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
      } else {
        setParticipants(participantsData || [])

        // Filter out host from game results
        const hostParticipant = participantsData?.find(p => (p as any).user_id === hostUserId)
        if (hostParticipant && data) {
          const filteredResults = data.filter(r => r.participant_id !== hostParticipant.id)
          setGameResults(filteredResults)
        } else {
          setGameResults(data || [])
        }
      }
    }
    if (hostUserId) {
      getResults()
    }
  }, [gameId, hostUserId])

  // Helper function to get participant avatar by ID
  const getParticipantAvatar = (participantId: string | null) => {
    if (!participantId) return undefined
    const participant = participants.find(p => p.id === participantId)
    return (participant as any)?.avatar_id
  }

  const topThree = gameResults.slice(0, 3)
  const restResults = gameResults.slice(3)

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/BGreward.png)' }}
      />
      
      {/* Overlay for better readability */}
      <div className="fixed inset-0 bg-black/20 -z-10" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-yellow-400 mb-4 drop-shadow-lg">
            Leaderboard
          </h1>
          <p className="text-purple-200 text-sm md:text-base max-w-2xl mx-auto">
            {quizSet.name}
          </p>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-12">
            <div className="flex items-end justify-center gap-4 md:gap-8 mb-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-purple-300 text-xl md:text-2xl font-bold mb-2">2</div>
                  <div className="relative mb-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-1 shadow-xl">
                      <div className="w-full h-full rounded-full bg-purple-800 flex items-center justify-center overflow-hidden">
                        <AvatarDisplay avatarId={getParticipantAvatar(topThree[1].participant_id)} size="lg" />
                      </div>
                    </div>
                  </div>
                  <div className="text-purple-200 text-sm md:text-base mb-1">@{topThree[1].nickname}</div>
                  <div className="text-yellow-400 text-xl md:text-2xl font-bold">{topThree[1].total_score}</div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center -mt-8">
                  <div className="text-6xl mb-2">👑</div>
                  <div className="relative mb-4">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-1 shadow-2xl">
                      <div className="w-full h-full rounded-full bg-purple-800 flex items-center justify-center overflow-hidden">
                        <AvatarDisplay avatarId={getParticipantAvatar(topThree[0].participant_id)} size="xl" />
                      </div>
                    </div>
                  </div>
                  <div className="text-white text-lg md:text-xl font-bold mb-1">@{topThree[0].nickname}</div>
                  <div className="text-yellow-400 text-3xl md:text-4xl font-black">{topThree[0].total_score}</div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center">
                  <div className="text-purple-300 text-xl md:text-2xl font-bold mb-2">3</div>
                  <div className="relative mb-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-1 shadow-xl">
                      <div className="w-full h-full rounded-full bg-purple-800 flex items-center justify-center overflow-hidden">
                        <AvatarDisplay avatarId={getParticipantAvatar(topThree[2].participant_id)} size="lg" />
                      </div>
                    </div>
                  </div>
                  <div className="text-purple-200 text-sm md:text-base mb-1">@{topThree[2].nickname}</div>
                  <div className="text-yellow-400 text-xl md:text-2xl font-bold">{topThree[2].total_score}</div>
                </div>
              )}
            </div>

            {/* Podium Base */}
            <div className="flex items-end justify-center gap-4 md:gap-8 max-w-2xl mx-auto">
              <div className="flex-1 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-t-2xl h-24 md:h-32 flex items-center justify-center shadow-xl">
                <span className="text-white text-5xl md:text-6xl font-black">2</span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-2xl h-32 md:h-40 flex items-center justify-center shadow-2xl">
                <span className="text-white text-6xl md:text-7xl font-black">1</span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-orange-500 to-orange-700 rounded-t-2xl h-20 md:h-28 flex items-center justify-center shadow-xl">
                <span className="text-white text-5xl md:text-6xl font-black">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Rest of Rankings */}
        {restResults.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-3">
            {restResults.map((gameResult, index) => (
              <div
                key={gameResult.participant_id}
                className="bg-gradient-to-r from-purple-600/80 to-purple-700/80 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow border border-purple-400/30"
              >
                {/* Rank */}
                <div className="w-8 h-8 bg-purple-800/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{index + 4}</span>
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-purple-800 flex items-center justify-center overflow-hidden">
                      <AvatarDisplay avatarId={getParticipantAvatar(gameResult.participant_id)} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Nickname */}
                <div className="flex-grow">
                  <div className="text-white font-bold text-lg">@{gameResult.nickname}</div>
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-yellow-400 text-xl md:text-2xl font-bold">{gameResult.total_score} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Confetti width={width} height={height} recycle={true} numberOfPieces={150} />
    </div>
  )
}
