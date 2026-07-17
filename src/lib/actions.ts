import type { SynthProject } from '../types'
import { audioEngine } from '../features/audio/audioEngine'
import { usePatternStore } from '../stores/patternStore'
import { usePlaybackStore } from '../stores/playbackStore'
import { useProjectStore } from '../stores/projectStore'
import { useSequencerStore } from '../stores/sequencerStore'

export async function openSavedProject(project: SynthProject) {
  audioEngine.pause()
  usePatternStore.getState().hydrate({ generatorId: project.generatorId, parameters: project.parameters, appearance: project.appearance, mappings: project.mappings })
  useSequencerStore.getState().hydrate(project.lanes, project.bpm)
  usePlaybackStore.getState().setAnalysis(project.analysis ?? null)
  if (project.audioBlob) {
    try { await audioEngine.loadFile(project.audioBlob, project.audioName || 'Stored audio') } catch { usePlaybackStore.getState().setError('The stored audio could not be reopened. Replace it from the Audio panel.') }
  } else {
    usePlaybackStore.getState().setAudio(null)
  }
  useProjectStore.getState().openProject(project)
}
