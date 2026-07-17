import { create } from 'zustand'
import type { SequencerLane } from '../types'

const wave = (length: number, phase = 0) => Array.from({ length }, (_, i) => Math.max(0.08, .5 + Math.sin(i * .74 + phase) * .38))
interface SequencerStore {
  bpm: number
  steps: 8 | 16 | 32 | 64
  lanes: SequencerLane[]
  setBpm: (bpm: number) => void
  setSteps: (steps: 8 | 16 | 32 | 64) => void
  setStep: (laneId: string, index: number, value: number) => void
  randomize: (laneId: string) => void
  addLane: (parameter?: string) => void
  removeLane: (id: string) => void
  hydrate: (lanes: SequencerLane[], bpm: number) => void
}
export const useSequencerStore = create<SequencerStore>((set) => ({
  bpm: 124, steps: 16,
  lanes: [
    { id: 'lane-a', name: 'Amplitude', parameter: 'amplitude', values: wave(16), enabled: true, bipolar: false },
    { id: 'lane-b', name: 'Displacement', parameter: 'displacement', values: wave(16, 2).map((v) => v * 2 - 1), enabled: true, bipolar: true },
  ],
  setBpm: (bpm) => set({ bpm }),
  setSteps: (steps) => set((s) => ({ steps, lanes: s.lanes.map((l) => ({ ...l, values: Array.from({ length: steps }, (_, i) => l.values[i % l.values.length] ?? .5) })) })),
  setStep: (laneId, index, value) => set((s) => ({ lanes: s.lanes.map((l) => l.id === laneId ? { ...l, values: l.values.map((v, i) => i === index ? value : v) } : l) })),
  randomize: (laneId) => set((s) => ({ lanes: s.lanes.map((l) => l.id === laneId ? { ...l, values: l.values.map(() => l.bipolar ? Math.random() * 2 - 1 : Math.random()) } : l) })),
  addLane: (parameter = 'scale') => set((s) => ({ lanes: [...s.lanes, { id: crypto.randomUUID(), name: parameter[0].toUpperCase() + parameter.slice(1), parameter, values: wave(s.steps, Math.random() * 5), enabled: true, bipolar: false }] })),
  removeLane: (id) => set((s) => ({ lanes: s.lanes.filter((l) => l.id !== id) })),
  hydrate: (lanes, bpm) => set({ lanes, bpm, steps: (lanes[0]?.values.length || 16) as 8 | 16 | 32 | 64 }),
}))
