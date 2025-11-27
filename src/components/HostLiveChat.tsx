'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/types/types'
import { AvatarDisplay } from '@/components/AvatarPicker'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ChatMessage {
  id: string
  game_id: string
  participant_id: string
  message: string
  created_at: string
  participant?: {
    nickname: string
    avatar_id: string
  }
}

interface HostLiveChatProps {
  gameId: string
  hostUserId: string
}

export default function HostLiveChat({
  gameId,
  hostUserId
}: HostLiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [hostParticipant, setHostParticipant] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatChannelRef = useRef<RealtimeChannel | null>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Create or get host as virtual participant
  useEffect(() => {
    const setupHostParticipant = async () => {
      try {
        // Check if host already has a participant record
        const { data: existing } = await supabase
          .from('participants')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', hostUserId)
          .maybeSingle()

        if (existing) {
          setHostParticipant(existing)
        } else {
          // Create virtual participant for host
          const { data: newParticipant, error } = await supabase
            .from('participants')
            .insert({
              game_id: gameId,
              user_id: hostUserId,
              nickname: '🎯 Host',
              avatar_id: 'crown'
            })
            .select()
            .single()

          if (!error && newParticipant) {
            setHostParticipant(newParticipant)
          }
        }
      } catch (error) {
        console.error('Error setting up host participant:', error)
      }
    }

    setupHostParticipant()
  }, [gameId, hostUserId])

  // Load participants
  useEffect(() => {
    const loadParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('id, nickname, avatar_id')
        .eq('game_id', gameId)

      if (data) {
        setParticipants(data)
      }
    }
    loadParticipants()
  }, [gameId])

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data && !error) {
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      }
    }
    loadMessages()
  }, [gameId])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-realtime:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe((status) => {
        console.log('Host chat subscription status:', status)
      })

    chatChannelRef.current = channel

    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current)
      }
    }
  }, [gameId])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending || !hostParticipant) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          game_id: gameId,
          participant_id: hostParticipant.id,
          message: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // Get participant info
  const getParticipantInfo = (participantId: string) => {
    return participants.find(p => p.id === participantId)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border-2 border-purple-400">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-t-lg">
        <h3 className="font-bold text-lg flex items-center gap-2">
          💬 Live Chat
          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
            {messages.length}
          </span>
        </h3>
        <p className="text-xs text-purple-100 mt-1">Monitor player conversations</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px] bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm">No messages yet. Players will chat here!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const participant = getParticipantInfo(msg.participant_id)
            const isHost = msg.participant_id === hostParticipant?.id

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isHost ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <AvatarDisplay
                    avatarId={participant?.avatar_id}
                    size="sm"
                  />
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col ${isHost ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${
                      isHost ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      {participant?.nickname || 'Unknown'}
                    </span>
                    {isHost && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        HOST
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isHost
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-white border-2 border-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send message to players..."
            maxLength={200}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending || !hostParticipant}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !hostParticipant}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {newMessage.length}/200 characters • You appear as &quot;🎯 Host&quot;
        </p>
      </form>
    </div>
  )
}
