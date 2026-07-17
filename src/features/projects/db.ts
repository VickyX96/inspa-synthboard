import Dexie, { type EntityTable } from 'dexie'
import type { SynthProject } from '../../types'
import { usePatternStore } from '../../stores/patternStore'
import { useProjectStore } from '../../stores/projectStore'
import { usePlaybackStore } from '../../stores/playbackStore'
import { useSequencerStore } from '../../stores/sequencerStore'

class InspaDatabase extends Dexie {
  projects!: EntityTable<SynthProject, 'id'>
  constructor() {
    super('inspa-synthboard')
    this.version(1).stores({ projects: 'id, updatedAt, name' })
  }
}

export const db = new InspaDatabase()

export function createProjectSnapshot(storeAudio = false): SynthProject {
  const project = useProjectStore.getState(), pattern = usePatternStore.getState(), playback = usePlaybackStore.getState(), sequence = useSequencerStore.getState()
  const now = Date.now()
  const existing = project.projects.find((p) => p.id === project.projectId)
  return {
    id: project.projectId, formatVersion: 1, name: project.name || 'Untitled pattern', createdAt: existing?.createdAt ?? now, updatedAt: now,
    generatorId: pattern.generatorId, parameters: pattern.parameters, mappings: pattern.mappings, lanes: sequence.lanes,
    appearance: pattern.appearance, bpm: sequence.bpm, audioName: playback.audio?.name,
    audioBlob: storeAudio ? playback.audio?.blob : existing?.audioBlob, analysis: playback.analysis ?? undefined,
  }
}

export async function saveCurrentProject(storeAudio = false) {
  const projectStore = useProjectStore.getState(); projectStore.setSaveState('saving')
  try {
    const project = createProjectSnapshot(storeAudio)
    await db.projects.put(project)
    const all = await db.projects.orderBy('updatedAt').reverse().toArray()
    projectStore.setProjects(all); projectStore.setSaveState('saved')
    return project
  } catch {
    projectStore.setSaveState('failed')
    throw new Error('Local storage is unavailable. Export a project file to keep your work.')
  }
}

export async function refreshProjects() {
  const projects = await db.projects.orderBy('updatedAt').reverse().toArray()
  useProjectStore.getState().setProjects(projects)
  return projects
}

export async function deleteProject(id: string) { await db.projects.delete(id); await refreshProjects() }

export async function duplicateProject(project: SynthProject) {
  await db.projects.add({ ...project, id: crypto.randomUUID(), name: `${project.name} copy`, createdAt: Date.now(), updatedAt: Date.now() })
  await refreshProjects()
}

export function downloadProject(project = createProjectSnapshot(false)) {
  const clean = { ...project, audioBlob: undefined }
  downloadBlob(new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' }), `${slug(project.name)}.inspa-synthboard.json`)
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'inspa-pattern'
