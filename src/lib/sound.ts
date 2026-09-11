// Web Audio API synthesizer for instant reliable notification sounds without external audio files
// Uses a single persistent AudioContext to avoid browser autoplay policy issues

let _audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!_audioCtx) {
      _audioCtx = new AudioContextClass()
    }
    return _audioCtx
  } catch {
    return null
  }
}

// Call this on any user click to unlock AudioContext for future autoplay
export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {
      return false
    }
  }
  return ctx.state === 'running'
}

export function isAudioUnlocked(): boolean {
  if (!_audioCtx) return false
  return _audioCtx.state === 'running'
}

export function playNotificationSound(type: 'booking' | 'urgent' | 'chime' = 'booking') {
  if (typeof window === 'undefined') return

  const ctx = getAudioContext()
  if (!ctx) return

  // Resume if suspended (works after user interaction)
  const play = () => {
    try {
      const now = ctx.currentTime

      if (type === 'urgent') {
        ;[0, 0.18, 0.36].forEach((delay) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, now + delay)
          gain.gain.setValueAtTime(0.4, now + delay)
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + delay)
          osc.stop(now + delay + 0.15)
        })
      } else if (type === 'chime') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(660, now)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.3)
      } else {
        // booking — 3-note pleasant chime
        const notes = [
          { freq: 659.25, time: 0, duration: 0.2 },
          { freq: 830.61, time: 0.16, duration: 0.25 },
          { freq: 987.77, time: 0.32, duration: 0.5 },
        ]
        notes.forEach((note) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(note.freq, now + note.time)
          gain.gain.setValueAtTime(0.4, now + note.time)
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.duration)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now + note.time)
          osc.stop(now + note.time + note.duration)
        })
      }
    } catch (err) {
      console.warn('Audio play error:', err)
    }
  }

  if (ctx.state === 'suspended') {
    ctx.resume().then(play).catch(() => {})
  } else {
    play()
  }
}

