import { create } from 'zustand'
import type { AudioAsset, OfflineAnalysis } from '../types'

interface PlaybackStore {
  audio: AudioAsset | null
  analysis: OfflineAnalysis | null
  status: 'idle' | 'analyzing' | 'ready' | 'error'
  progress: number
  error: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  loop: boolean
  muted: boolean
  volume: number
  setAudio: (audio: AudioAsset | null) => void
  setAnalysis: (analysis: OfflineAnalysis | null) => void
  setStatus: (status: PlaybackStore['status'], progress?: number) => void
  setError: (error: string | null) => void
  setPlaying: (playing: boolean) => void
  setTime: (currentTime: number, duration?: number) => void
  toggleLoop: () => void
  toggleMute: () => void
  setVolume: (volume: number) => void
  reset: () => void
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  audio: null, analysis: null, status: 'idle', progress: 0, error: null,
  isPlaying: false, currentTime: 0, duration: 0, loop: false, muted: false, volume: .82,
  setAudio: (audio) => set({ audio, duration: audio?.duration ?? 0 }),
  setAnalysis: (analysis) => set({ analysis, duration: analysis?.duration ?? 0 }),
  setStatus: (status, progress = 0) => set({ status, progress }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setTime: (currentTime, duration) => set((s) => ({ currentTime, duration: duration ?? s.duration })),
  toggleLoop: () => set((s) => ({ loop: !s.loop })),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setVolume: (volume) => set({ volume }),
  reset: () => set({ audio: null, analysis: null, status: 'idle', progress: 0, error: null, isPlaying: false, currentTime: 0, duration: 0 }),
}))
