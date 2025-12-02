import { Participant, supabase } from '@/types/types'
import { FormEvent, useEffect, useState } from 'react'
import AvatarPicker from '@/components/AvatarPicker'
import { getRandomAvatar } from '@/utils/avatars'
import LiveChat from '@/components/LiveChat'
import LiveReactions from '@/components/LiveReactions'
import TeamSelector from '@/components/TeamSelector'

interface Game {
  id: string
  team_mode: boolean
  max_teams: number
}

export default function Lobby({
  gameId,
  onRegisterCompleted,
}: {
  gameId: string
  onRegisterCompleted: (participant: Participant) => void
}) {
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [game, setGame] = useState<Game | null>(null)

  useEffect(() => {
    const fetchGameAndParticipant = async () => {
      // Load game settings
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('id, team_mode, max_teams')
        .eq('id', gameId)
        .single()

      if (gameError) {
        console.error('Game fetch error:', gameError)
        return
      }

      setGame(gameData as Game)

      // Check localStorage for existing participant in THIS game
      const storageKey = `participant_${gameId}`
      const savedParticipantId = localStorage.getItem(storageKey)

      if (!savedParticipantId) {
        // No saved participant for this game - show register form
        return
      }

      // Verify participant still exists in database
      const { data: participantData, error } = await supabase
        .from('participants')
        .select()
        .eq('id', savedParticipantId)
        .eq('game_id', gameId)
        .maybeSingle()

      if (error || !participantData) {
        // Participant not found - clear localStorage and show register form
        localStorage.removeItem(storageKey)
        return
      }

      // Valid participant found - auto-login
      setParticipant(participantData)
      onRegisterCompleted(participantData)
    }

    fetchGameAndParticipant()
  }, [gameId, onRegisterCompleted])

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/BGlobby.jpg')" }}
    >
      {/* Reactions Overlay (only show when registered) */}
      {participant && (
        <LiveReactions
          gameId={gameId}
          participantId={participant.id}
          showPicker={true}
        />
      )}

      <div className={`bg-white bg-opacity-95 p-6 sm:p-8 md:p-12 rounded-2xl shadow-2xl backdrop-blur-lg w-full ${participant ? 'max-w-4xl' : 'max-w-md'}`}>
        {!participant && game && (
          <Register
            gameId={gameId}
            onRegisterCompleted={(participant) => {
              onRegisterCompleted(participant)
              setParticipant(participant)
            }}
          />
        )}

        {participant && game && (
          <div className="text-gray-800 w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Welcome Message & Team Selector */}
            <div>
              <h1 className="text-2xl sm:text-3xl pb-4 font-bold text-orange-600">
                Welcome {participant.nickname}! 🎉
              </h1>
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
                <p className="text-base sm:text-lg text-gray-700">
                  ✅ You&apos;re registered!<br />
                  🎮 Waiting for host to start...<br />
                  💬 Chat with other players below!
                </p>
              </div>

              {/* Team Selector (if team mode enabled) */}
              {game.team_mode && (
                <div className="mb-4">
                  <TeamSelector
                    gameId={gameId}
                    maxTeams={game.max_teams as 2 | 3 | 4}
                    selectedTeam={(participant as any).team_id}
                    onTeamSelected={async (teamId) => {
                      // Update participant's team
                      const { error } = await supabase
                        .from('participants')
                        .update({ team_id: teamId })
                        .eq('id', participant.id)

                      if (error) {
                        console.error('Error updating team:', error)
                        alert('Failed to join team')
                      } else {
                        // Update local state
                        setParticipant({ ...participant, team_id: teamId } as any)
                      }
                    }}
                  />
                </div>
              )}

              <div className="text-sm text-gray-600 bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
                <p className="font-semibold mb-1">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  {game.team_mode && <li>Choose your team above! 🏆</li>}
                  <li>Send reactions with the emoji button 😊</li>
                  <li>Chat with other players</li>
                  <li>Get ready for the quiz!</li>
                </ul>
              </div>
            </div>

            {/* Live Chat */}
            <div>
              <LiveChat
                gameId={gameId}
                participantId={participant.id}
                participantNickname={participant.nickname}
                participantAvatar={(participant as any).avatar_id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Register({
  onRegisterCompleted,
  gameId,
}: {
  onRegisterCompleted: (player: Participant) => void
  gameId: string
}) {
  const [nickname, setNickname] = useState('')
  const [avatarId, setAvatarId] = useState('cat') // Fixed default to prevent hydration mismatch
  const [sending, setSending] = useState(false)

  // Set random avatar only on client side after mounting
  useEffect(() => {
    setAvatarId(getRandomAvatar().id)
  }, [])

  const onFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)

    if (!nickname) {
      setSending(false)
      return
    }

    // Always sign out first to get a fresh anonymous user for each game
    // This prevents "duplicate key" error from user_id constraint
    await supabase.auth.signOut()

    // Sign in anonymously with fresh user
    const { data, error: authError } = await supabase.auth.signInAnonymously()
    if (authError) {
      console.error('Auth error:', authError)
      alert('Failed to authenticate. Please try again.')
      setSending(false)
      return
    }
    const userId = data?.user?.id ?? null

    if (!userId) {
      alert('Failed to get user ID. Please refresh and try again.')
      setSending(false)
      return
    }

    // Insert participant with explicit user_id and avatar_id
    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        nickname,
        game_id: gameId,
        user_id: userId,
        avatar_id: avatarId
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      setSending(false)
      return alert(error.message)
    }

    // Save participant_id to localStorage for this specific game
    const storageKey = `participant_${gameId}`
    localStorage.setItem(storageKey, participant.id)

    onRegisterCompleted(participant)
  }

  return (
    <form onSubmit={(e) => onFormSubmit(e)} className="space-y-4 sm:space-y-5">
      {/* Avatar Picker */}
      <div>
        <label className="block text-orange-600 text-sm sm:text-base font-bold mb-2">
          Choose your avatar
        </label>
        <AvatarPicker
          selectedAvatarId={avatarId}
          onSelect={setAvatarId}
        />
      </div>

      {/* Nickname Input */}
      <div>
        <label className="block text-orange-600 text-sm sm:text-base font-bold mb-2">
          Enter your nickname
        </label>
        <input
          className="p-3 sm:p-4 w-full border-2 border-orange-300 rounded-lg text-gray-800 text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          type="text"
          value={nickname}
          onChange={(val) => setNickname(val.currentTarget.value)}
          placeholder="Your nickname"
          maxLength={20}
          required
        />
      </div>

      {/* Join Button */}
      <button
        disabled={sending}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:bg-gray-400 text-white font-bold text-base sm:text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 active:scale-95"
      >
        {sending ? 'Joining...' : 'Join Game 🎮'}
      </button>
    </form>
  )
}
