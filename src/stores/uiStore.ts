import { create } from 'zustand'

export type LeftTab = 'projects' | 'audio' | 'patterns' | 'presets'
interface UIStore {
  leftTab: LeftTab
  inspectorSection: string
  exportOpen: boolean
  settingsOpen: boolean
  safeArea: boolean
  aspectRatio: string
  quality: 'Low' | 'Medium' | 'High' | 'Ultra'
  interaction: boolean
  setLeftTab: (tab: LeftTab) => void
  setInspectorSection: (section: string) => void
  setExportOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSafeArea: (safe: boolean) => void
  setAspectRatio: (aspectRatio: string) => void
  setQuality: (quality: UIStore['quality']) => void
  setInteraction: (interaction: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  leftTab: 'patterns', inspectorSection: 'pattern', exportOpen: false, settingsOpen: false,
  safeArea: false, aspectRatio: '16:9', quality: 'High', interaction: true,
  setLeftTab: (leftTab) => set({ leftTab }), setInspectorSection: (inspectorSection) => set({ inspectorSection }),
  setExportOpen: (exportOpen) => set({ exportOpen }), setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSafeArea: (safeArea) => set({ safeArea }), setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setQuality: (quality) => set({ quality }), setInteraction: (interaction) => set({ interaction }),
}))
