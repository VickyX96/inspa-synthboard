import { create } from 'zustand'
import type { SynthProject } from '../types'

interface ProjectStore {
  projectId: string
  name: string
  saveState: 'saved' | 'saving' | 'unsaved' | 'failed'
  projects: SynthProject[]
  setName: (name: string) => void
  setSaveState: (saveState: ProjectStore['saveState']) => void
  setProjects: (projects: SynthProject[]) => void
  openProject: (project: SynthProject) => void
  newProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projectId: crypto.randomUUID(), name: 'Untitled pattern', saveState: 'unsaved', projects: [],
  setName: (name) => set({ name, saveState: 'unsaved' }),
  setSaveState: (saveState) => set({ saveState }),
  setProjects: (projects) => set({ projects }),
  openProject: (project) => set({ projectId: project.id, name: project.name, saveState: 'saved' }),
  newProject: () => set({ projectId: crypto.randomUUID(), name: 'Untitled pattern', saveState: 'unsaved' }),
}))
