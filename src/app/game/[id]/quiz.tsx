import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question, supabase, GameResult, Participant } from '@/types/types'
import { useState, useEffect } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'
import { playSound } from '@/utils/sounds'
import SoundControl from '@/components/SoundControl'
import LiveReactions from '@/components/LiveReactions'
import VerticalLeaderboard from '@/components/VerticalLeaderboard'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  participantId: playerId,
  isAnswerRevealed,
  gameId,
}: {
  question: Question
  questionCount: number
  participantId: string
  isAnswerRevealed: boolean
  gameId?: string
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const [leaderboard, setLeaderboard] = useState<GameResult[]>([])

  const [participants, setParticipants] = useState<Participant[]>([])

  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
  }, [question.id])

  useEffect(() => {
    // Play sound when answer is revealed
    if (isAnswerRevealed && chosenChoice) {
      try {
        if (chosenChoice.is_correct) {
          playSound('correct')
        } else {
          playSound('wrong')
        }
      } catch (e) {
        console.debug('Sound playback failed', e)
      }

      // Fetch leaderboard and participants when answer is revealed
      if (gameId) {
        fetchLeaderboard()
      }
    }
  }, [isAnswerRevealed, chosenChoice, gameId])

  const fetchLeaderboard = async () => {
    if (!gameId) return

    try {
      // Fetch all game results for leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })

      if (leaderboardError) {
        console.error('Error fetching leaderboard:', leaderboardError)
        setLoadError('Failed to load leaderboard')
        return
      }

      if (leaderboardData) {
        setLeaderboard(leaderboardData)
      }

      // Fetch participants for avatar display
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select()
        .eq('game_id', gameId)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
        return
      }

      if (participantsData) {
        setParticipants(participantsData)
      }
    } catch (e) {
      console.error('Error in fetchLeaderboard:', e)
      setLoadError('Failed to load data')
    }
  }

  const answer = async (choice: Choice) => {
    setChosenChoice(choice)

    const now = Date.now()
    const score = !choice.is_correct
      ? 0
      : 1000 -
        Math.round(
          Math.max(
            0,
            Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)
          ) * 1000
        )

    const { error } = await supabase.from('answers').insert({
      participant_id: playerId,
      question_id: question.id,
      choice_id: choice.id,
      score,
    })
    if (error) {
      setChosenChoice(null)
      alert(error.message)
    }
  }

  return (
    <div className="h-screen flex flex-col items-stretch bg-slate-900 relative">
      {/* Error Display */}
      {loadError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {loadError}
        </div>
      )}

      <SoundControl />

      {/* Live Reactions */}
      {gameId && (
        <LiveReactions
          gameId={gameId}
          participantId={playerId}
          showPicker={true}
        />
      )}

      <div className="flex-grow flex justify-center items-center text-center px-4 py-4">
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl bg-white font-bold p-4 sm:p-6 md:p-8 lg:p-12 rounded inline-block max-w-5xl">
          {question.body}
        </h2>
      </div>

      {!isAnswerRevealed && chosenChoice && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-white text-lg sm:text-xl md:text-2xl text-center p-4">
            Wait for others to answer...
          </div>
        </div>
      )}

      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-transparent flex justify-center">
            {typeof window !== 'undefined' && (
              <CountdownCircleTimer
                onComplete={() => {
                  setHasShownChoices(true)
                  setQuestionStartTime(Date.now())
                }}
                isPlaying
                duration={TIME_TIL_CHOICE_REVEAL / 1000}
                colors={['#fff', '#fff', '#fff', '#fff']}
                trailColor={'transparent' as ColorFormat}
                colorsTime={[7, 5, 2, 0]}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            )}
          </div>
        </div>
      )}

      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex-grow flex flex-col items-stretch">
          <div className="flex-grow"></div>
          <div className="flex justify-between flex-wrap p-2 sm:p-4">
            {question.choices.map((choice, index) => (
              <div key={choice.id} className="w-1/2 p-1">
                <button
                  onClick={() => answer(choice)}
                  disabled={chosenChoice !== null || isAnswerRevealed}
                  className={`px-2 py-3 sm:px-4 sm:py-6 w-full text-sm sm:text-lg md:text-xl lg:text-2xl rounded text-white flex justify-between font-bold active:scale-95 transition-transform
              ${
                index === 0
                  ? 'bg-red-500 hover:bg-red-600'
                  : index === 1
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : index === 2
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-green-500 hover:bg-green-600'
              }
              ${isAnswerRevealed && !choice.is_correct ? 'opacity-60' : ''}
             `}
                >
                  <div className="text-left break-words">{choice.body}</div>
                  {isAnswerRevealed && (
                    <div className="flex-shrink-0 ml-2">
                      {choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-4 h-4 sm:w-6 sm:h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      )}
                      {!choice.is_correct && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={5}
                          stroke="currentColor"
                          className="w-4 h-4 sm:w-6 sm:h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAnswerRevealed && (
        <div className="flex-grow overflow-y-auto p-4">
          <div className="flex flex-col items-center gap-4">
            {/* Answer Result */}
            <div className="text-center">
              <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3">
                {chosenChoice?.is_correct ? '🎉 Correct!' : '❌ Incorrect'}
              </h2>
              <div
                className={`inline-block text-white rounded-full p-4 sm:p-6 ${
                  chosenChoice?.is_correct ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {chosenChoice?.is_correct && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={5}
                    stroke="currentColor"
                    className="w-8 h-8 sm:w-12 sm:h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                )}
                {!chosenChoice?.is_correct && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={5}
                    stroke="currentColor"
                    className="w-8 h-8 sm:w-12 sm:h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Vertical Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="w-full mt-4">
                <VerticalLeaderboard
                  gameResults={leaderboard}
                  participants={participants}
                  maxDisplay={8}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex text-white py-2 sm:py-3 px-4 items-center bg-black">
        <div className="text-lg sm:text-xl md:text-2xl font-bold">
          {question.order + 1}/{questionCount}
        </div>
      </div>
    </div>
  )
}
