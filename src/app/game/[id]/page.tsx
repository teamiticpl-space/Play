'use client'

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Choice, Game, Participant, Question, supabase, GameResult } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import { AvatarDisplay } from '@/components/AvatarPicker'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const onRegisterCompleted = (participant: Participant) => {
    setParticipant(participant)
    getGame()
  }

  const stateRef = useRef<Participant | null>()

  const [participant, setParticipant] = useState<Participant | null>()

  stateRef.current = participant

  const [currentScreen, setCurrentScreen] = useState(Screens.lobby)

  const [questions, setQuestions] = useState<Question[]>()

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const getGame = async () => {
    const { data: game } = await supabase
      .from('games')
      .select()
      .eq('id', gameId)
      .single()
    if (!game) return
    setCurrentScreen(game.phase as Screens)
    if (game.phase == Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    getQuestions(game.quiz_set_id)
  }

  const getQuestions = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, choices(*)`)
      .eq('quiz_set_id', quizSetId)
      .order('order', { ascending: true })
    if (error) {
      getQuestions(quizSetId)
      return
    }
    setQuestions(data)
  }

  useEffect(() => {
    const setGameListner = (): RealtimeChannel => {
      return supabase
        .channel('game_participant')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            if (!stateRef.current) return

            // start the quiz game
            const game = payload.new as Game

            if (game.phase == 'result') {
              setCurrentScreen(Screens.results)
            } else {
              setCurrentScreen(Screens.quiz)
              setCurrentQuestionSequence(game.current_question_sequence)
              setIsAnswerRevealed(game.is_answer_revealed)
            }
          }
        )
        .subscribe()
    }

    const gameChannel = setGameListner()
    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [gameId])

  return (
    <main className="bg-green-500 min-h-screen">
      {currentScreen == Screens.lobby && (
        <Lobby
          onRegisterCompleted={onRegisterCompleted}
          gameId={gameId}
        ></Lobby>
      )}
      {currentScreen == Screens.quiz && questions && (
        <Quiz
          question={questions![currentQuestionSequence]}
          questionCount={questions!.length}
          participantId={participant!.id}
          isAnswerRevealed={isAnswerRevealed}
        ></Quiz>
      )}
      {currentScreen == Screens.results && (
        <Results participant={participant!}></Results>
      )}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [myRank, setMyRank] = useState<number>(0)
  const [myScore, setMyScore] = useState<number>(0)
  const [participants, setParticipants] = useState<Participant[]>([])
  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
      // Fetch game results
      const { data, error } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', participant.game_id)
        .order('total_score', { ascending: false })

      if (error) {
        console.error(error)
        return
      }

      setGameResults(data || [])

      // Find my rank and score
      const myIndex = data?.findIndex(r => r.participant_id === participant.id)
      if (myIndex !== undefined && myIndex !== -1 && data) {
        setMyRank(myIndex + 1)
        setMyScore(data[myIndex].total_score || 0)
      }

      // Fetch participants with avatars
      const { data: participantsData } = await supabase
        .from('participants')
        .select()
        .eq('game_id', participant.game_id)

      setParticipants(participantsData || [])
    }
    getResults()
  }, [participant.game_id, participant.id])

  const getParticipantAvatar = (participantId: string | null) => {
    if (!participantId) return undefined
    const p = participants.find(p => p.id === participantId)
    return (p as any)?.avatar_id
  }

  const showConfetti = myRank <= 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 px-4 py-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="text-center mb-6">
        <div className="bg-white inline-block rounded-lg px-8 py-6 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Hey {participant.nickname}! 🎉
          </h2>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{myScore}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600">#{myRank}</div>
              <div className="text-sm text-gray-600">Rank</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-white text-center mb-4">🏆 Leaderboard</h3>
        {gameResults.map((result, index) => {
          const isMe = result.participant_id === participant.id
          return (
            <div
              key={result.participant_id}
              className={`flex justify-between items-center py-3 px-4 rounded-lg my-2 transition ${
                isMe
                  ? 'bg-yellow-300 shadow-2xl border-4 border-yellow-500 scale-105'
                  : index < 3
                    ? 'bg-white shadow-xl border-2 border-yellow-400'
                    : 'bg-white shadow-md'
              }`}
            >
              {/* Rank */}
              <div className={`pr-4 ${index < 3 ? 'text-3xl' : 'text-xl'} font-bold flex-shrink-0`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                <AvatarDisplay
                  avatarId={getParticipantAvatar(result.participant_id)}
                  size={index < 3 ? 'md' : 'sm'}
                />
              </div>

              {/* Nickname */}
              <div className={`flex-grow font-bold ml-4 truncate ${
                index < 3 ? 'text-2xl' : 'text-lg'
              }`}>
                {result.nickname} {isMe && '(You)'}
              </div>

              {/* Score */}
              <div className="pl-4 flex-shrink-0 text-right">
                <div className={`${index < 3 ? 'text-2xl' : 'text-xl'} font-bold text-purple-600`}>
                  {result.total_score}
                </div>
                <div className="text-xs text-gray-600">points</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-white text-lg">Thanks for playing! 🎮</p>
      </div>
    </div>
  )
}
