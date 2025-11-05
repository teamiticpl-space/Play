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

  const { width, height } = useWindowSize()

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

      setGameResults(data)

      // Fetch participants with avatars
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
      } else {
        setParticipants(participantsData || [])
      }
    }
    getResults()
  }, [gameId])

  // Helper function to get participant avatar by ID
  const getParticipantAvatar = (participantId: string | null) => {
    if (!participantId) return undefined
    const participant = participants.find(p => p.id === participantId)
    return (participant as any)?.avatar_id
  }

  return (
    <div className={`min-h-screen ${theme.resultsBg} px-4 py-6`}>
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl my-4 py-3 sm:py-4 px-6 sm:px-12 bg-white inline-block rounded font-bold">
          {quizSet.name}
        </h1>
      </div>
      <div className="flex justify-center items-stretch">
        <div className="w-full max-w-3xl">
          {gameResults.map((gameResult, index) => (
            <div
              key={gameResult.participant_id}
              className={`flex justify-between items-center bg-white py-2 sm:py-3 px-3 sm:px-6 rounded-lg my-2 sm:my-4 w-full ${
                index < 3 ? 'shadow-xl border-2 border-yellow-400' : 'shadow-md'
              }`}
            >
              {/* Rank */}
              <div className={`pr-2 sm:pr-4 ${index < 3 ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl'} font-bold flex-shrink-0`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <AvatarDisplay
                  avatarId={getParticipantAvatar(gameResult.participant_id)}
                  size={index < 3 ? 'md' : 'sm'}
                />
              </div>

              {/* Nickname */}
              <div
                className={`flex-grow font-bold ml-2 sm:ml-4 truncate ${
                  index < 3 ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl' : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                }`}
              >
                {gameResult.nickname}
              </div>

              {/* Score */}
              <div className="pl-2 sm:pl-4 flex-shrink-0 text-right">
                <div className={`${index < 3 ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg md:text-xl'} font-bold`}>
                  {gameResult.total_score}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Confetti width={width} height={height} recycle={true} />
    </div>
  )
}
