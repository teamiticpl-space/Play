// Sound Effects Manager for ICPG Quiz

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {}
  private music: HTMLAudioElement | null = null
  private isMuted: boolean = false
  private musicVolume: number = 0.3
  private sfxVolume: number = 0.5

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSounds()
    }
  }

  private initSounds() {
    try {
      // Sound URLs (using free sound libraries)
      const soundUrls = {
        correct: 'https://cdn.pixabay.com/audio/2022/03/24/audio_805cb36a39.mp3', // Success
        wrong: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7265509330.mp3', // Error
        tick: 'https://cdn.pixabay.com/audio/2022/10/30/audio_701173d310.mp3', // Clock tick
        join: 'https://cdn.pixabay.com/audio/2022/03/10/audio_f42a9e649f.mp3', // Player join notification
        start: 'https://cdn.pixabay.com/audio/2022/03/15/audio_942594ff19.mp3', // Game start
        celebrate: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3', // Victory fanfare
        lobby: '/lobby-music.mp3', // Local lobby background music
      }

      // Preload sounds with error handling
      Object.entries(soundUrls).forEach(([key, url]) => {
        try {
          const audio = new Audio(url)
          audio.preload = 'metadata' // Changed from 'auto' to reduce initial load
          audio.volume = this.sfxVolume
          
          // Add error handler for each audio element
          audio.addEventListener('error', (e) => {
            console.warn(`Failed to load sound: ${key}`, e)
          })
          
          this.sounds[key] = audio
        } catch (e) {
          console.warn(`Failed to create audio for: ${key}`, e)
        }
      })

      // Load music from localStorage with error handling
      try {
        const savedMute = localStorage.getItem('supaquiz_muted')
        this.isMuted = savedMute === 'true'
      } catch (e) {
        console.warn('Failed to access localStorage', e)
        this.isMuted = false
      }
    } catch (e) {
      console.error('Failed to initialize sounds', e)
    }
  }

  // Play sound effect
  play(soundName: string) {
    try {
      if (this.isMuted) return

      const sound = this.sounds[soundName]
      if (sound) {
        sound.currentTime = 0
        sound.play().catch((e) => {
          // Silently fail - don't block the app
          console.debug('Sound play failed:', soundName, e)
        })
      }
    } catch (e) {
      // Silently fail - don't block the app
      console.debug('Sound play error:', soundName, e)
    }
  }

  // Play background music (looping)
  playMusic(musicName: string = 'lobby') {
    if (this.isMuted) return

    const music = this.sounds[musicName]
    if (music) {
      music.loop = true
      music.volume = this.musicVolume
      music.play().catch((e) => console.log('Music play failed:', e))
      this.music = music
    }
  }

  // Stop background music
  stopMusic() {
    if (this.music) {
      this.music.pause()
      this.music.currentTime = 0
      this.music = null
    }
  }

  // Countdown tick (repeating)
  startCountdownTick(duration: number) {
    if (this.isMuted) return

    const tickSound = this.sounds['tick']
    if (!tickSound) return

    let ticks = 0
    const maxTicks = Math.floor(duration)

    const interval = setInterval(() => {
      if (ticks >= maxTicks) {
        clearInterval(interval)
        return
      }
      this.play('tick')
      ticks++
    }, 1000)

    return interval
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted
    
    try {
      localStorage.setItem('supaquiz_muted', String(this.isMuted))
    } catch (e) {
      console.warn('Failed to save mute state', e)
    }

    if (this.isMuted) {
      this.stopMusic()
    }

    return this.isMuted
  }

  // Get mute state
  isSoundMuted() {
    return this.isMuted
  }

  // Set volume
  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = this.sfxVolume
    })
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.music) {
      this.music.volume = this.musicVolume
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager()

// Convenience functions
export const playSound = (sound: string) => soundManager.play(sound)
export const playMusic = (music?: string) => soundManager.playMusic(music)
export const stopMusic = () => soundManager.stopMusic()
export const toggleMute = () => soundManager.toggleMute()
export const isMuted = () => soundManager.isSoundMuted()
