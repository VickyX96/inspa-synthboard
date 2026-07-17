export interface AudioFrame {
  time: number
  deltaTime: number
  progress: number
  rms: number
  peak: number
  sub: number
  bass: number
  lowMid: number
  mid: number
  highMid: number
  treble: number
  centroid: number
  flux: number
  transient: number
  beat: number
  onset: number
}

export type ParameterValue = number | string | boolean
export type ParameterType = 'number' | 'toggle' | 'select' | 'color' | 'angle'

export interface PatternParameterDefinition {
  id: string
  label: string
  type: ParameterType
  min?: number
  max?: number
  step?: number
  defaultValue: ParameterValue
  unit?: string
  group: string
  animatable: boolean
  audioMappable: boolean
  options?: string[]
}

export interface PatternGeneratorDefinition {
  id: string
  name: string
  shortName: string
  description: string
  category: string
  shaderMode: number
  defaultParameters: Record<string, ParameterValue>
  parameterDefinitions: PatternParameterDefinition[]
}

export type AudioSource = 'rms' | 'peak' | 'bass' | 'mid' | 'treble' | 'flux' | 'transient' | 'beat' | 'progress'

export interface AudioMapping {
  id: string
  source: AudioSource
  target: string
  amount: number
  min: number
  max: number
  invert: boolean
  enabled: boolean
  mode: 'add' | 'replace'
}

export interface SequencerLane {
  id: string
  name: string
  parameter: string
  values: number[]
  enabled: boolean
  bipolar: boolean
}

export interface AppearanceSettings {
  background: string
  primary: string
  secondary: string
  accent: string
  glow: number
  grain: number
  vignette: number
}

export interface OfflineAnalysis {
  waveform: number[]
  bpm: number
  confidence: number
  beats: number[]
  duration: number
  peaks: number[]
}

export interface AudioAsset {
  name: string
  type: string
  size: number
  duration: number
  url: string
  blob?: Blob
  isDemo?: boolean
}

export interface SynthProject {
  id: string
  formatVersion: 1
  name: string
  createdAt: number
  updatedAt: number
  generatorId: string
  parameters: Record<string, ParameterValue>
  mappings: AudioMapping[]
  lanes: SequencerLane[]
  appearance: AppearanceSettings
  bpm: number
  audioName?: string
  audioBlob?: Blob
  analysis?: OfflineAnalysis
}
