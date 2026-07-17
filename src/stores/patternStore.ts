import { create } from 'zustand'
import type { AppearanceSettings, AudioMapping, ParameterValue } from '../types'
import { getPatternGenerator } from '../features/patterns/registry'

export const palettes: Record<string, AppearanceSettings> = {
  Graphite: { background: '#09090a', primary: '#f0eee9', secondary: '#747474', accent: '#ef3d2f', glow: .16, grain: .1, vignette: .24 },
  'Signal Red': { background: '#100a0a', primary: '#ff4a3d', secondary: '#701d1a', accent: '#fff0ea', glow: .24, grain: .12, vignette: .3 },
  Ice: { background: '#071015', primary: '#d7fbff', secondary: '#3f8091', accent: '#72deef', glow: .22, grain: .08, vignette: .18 },
  Ultraviolet: { background: '#0c0712', primary: '#d9bdff', secondary: '#633d80', accent: '#f158ff', glow: .25, grain: .1, vignette: .26 },
}

interface Snapshot { generatorId: string; parameters: Record<string, ParameterValue>; appearance: AppearanceSettings }
interface PatternStore extends Snapshot {
  mappings: AudioMapping[]
  history: Snapshot[]
  future: Snapshot[]
  setGenerator: (id: string) => void
  setParameter: (id: string, value: ParameterValue, record?: boolean) => void
  setAppearance: (partial: Partial<AppearanceSettings>) => void
  applyPalette: (name: string) => void
  setMappings: (items: AudioMapping[]) => void
  addMapping: () => void
  removeMapping: (id: string) => void
  undo: () => void
  redo: () => void
  hydrate: (snapshot: Snapshot & { mappings?: AudioMapping[] }) => void
}

const base = getPatternGenerator('bars')
const initialMappings: AudioMapping[] = [
  { id: 'map-bass', source: 'bass', target: 'amplitude', amount: .8, min: .2, max: 1.3, invert: false, enabled: true, mode: 'add' },
  { id: 'map-treble', source: 'treble', target: 'barWidth', amount: .25, min: .2, max: .9, invert: false, enabled: true, mode: 'add' },
]

const snap = (s: PatternStore): Snapshot => ({ generatorId: s.generatorId, parameters: { ...s.parameters }, appearance: { ...s.appearance } })

export const usePatternStore = create<PatternStore>((set) => ({
  generatorId: base.id,
  parameters: { ...base.defaultParameters },
  appearance: { ...palettes.Graphite },
  mappings: initialMappings,
  history: [], future: [],
  setGenerator: (id) => set((s) => {
    const g = getPatternGenerator(id)
    return { history: [...s.history.slice(-39), snap(s)], future: [], generatorId: g.id, parameters: { ...g.defaultParameters } }
  }),
  setParameter: (id, value, record = false) => set((s) => ({
    history: record ? [...s.history.slice(-39), snap(s)] : s.history,
    future: record ? [] : s.future,
    parameters: { ...s.parameters, [id]: value },
  })),
  setAppearance: (partial) => set((s) => ({ history: [...s.history.slice(-39), snap(s)], future: [], appearance: { ...s.appearance, ...partial } })),
  applyPalette: (name) => set((s) => ({ history: [...s.history.slice(-39), snap(s)], future: [], appearance: { ...(palettes[name] ?? palettes.Graphite) } })),
  setMappings: (mappings) => set({ mappings }),
  addMapping: () => set((s) => ({ mappings: [...s.mappings, { id: crypto.randomUUID(), source: 'rms', target: Object.keys(s.parameters)[0] ?? 'scale', amount: .5, min: 0, max: 1, invert: false, enabled: true, mode: 'add' }] })),
  removeMapping: (id) => set((s) => ({ mappings: s.mappings.filter((m) => m.id !== id) })),
  undo: () => set((s) => {
    const previous = s.history.at(-1); if (!previous) return s
    return { ...previous, mappings: s.mappings, history: s.history.slice(0, -1), future: [snap(s), ...s.future] }
  }),
  redo: () => set((s) => {
    const next = s.future[0]; if (!next) return s
    return { ...next, mappings: s.mappings, history: [...s.history, snap(s)], future: s.future.slice(1) }
  }),
  hydrate: (data) => set({ generatorId: data.generatorId, parameters: data.parameters, appearance: data.appearance, mappings: data.mappings ?? initialMappings, history: [], future: [] }),
}))
