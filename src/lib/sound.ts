// Web Audio API synthesizer for instant reliable notification sounds without external audio files

export function playNotificationSound(type: 'booking' | 'urgent' | 'chime' = 'booking') {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    if (type === 'urgent') {
      [0, 0.18, 0.36].forEach((delay) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, now + delay)
        gain.gain.setValueAtTime(0.3, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.12)
      })
    } else {
      const notes = [
        { freq: 659.25, time: 0, duration: 0.18 },
        { freq: 830.61, time: 0.14, duration: 0.22 },
        { freq: 987.77, time: 0.28, duration: 0.45 }
      ]

      notes.forEach((note) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(note.freq, now + note.time)

        gain.gain.setValueAtTime(0.35, now + note.time)
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
