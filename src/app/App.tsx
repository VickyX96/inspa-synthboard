import { lazy, Suspense, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EmptyState } from '../components/EmptyState'
import { LeftSidebar } from '../components/LeftSidebar'
import { Inspector } from '../components/Inspector'
import { Timeline } from '../components/Timeline'
import { usePlaybackStore } from '../stores/playbackStore'
import { useProjectStore } from '../stores/projectStore'
import { usePatternStore } from '../stores/patternStore'
import { useSequencerStore } from '../stores/sequencerStore'
import { useUIStore } from '../stores/uiStore'
import { audioEngine } from '../features/audio/audioEngine'
import { refreshProjects, saveCurrentProject } from '../features/projects/db'

const CanvasWorkspace = lazy(() => import('../components/CanvasWorkspace').then((module) => ({ default: module.CanvasWorkspace })))
const ExportModal = lazy(() => import('../components/ExportModal').then((module) => ({ default: module.ExportModal })))

export default function App() {
  const audio = usePlaybackStore((s) => s.audio), status = usePlaybackStore((s) => s.status), error = usePlaybackStore((s) => s.error)
  const savedOpen = useProjectStore((s) => s.saveState) === 'saved'
  const autosave = useRef<number>(0)

  useEffect(() => { refreshProjects().catch(() => usePlaybackStore.getState().setError('Local project storage is unavailable in this browser.')) }, [])
  useEffect(() => {
    const dirty = () => {
      const project = useProjectStore.getState()
      if (!usePlaybackStore.getState().audio && project.saveState !== 'saved') return
      project.setSaveState('unsaved'); clearTimeout(autosave.current)
      autosave.current = window.setTimeout(() => saveCurrentProject(false).catch(() => undefined), 1800)
    }
    const unsubPattern = usePatternStore.subscribe(dirty), unsubSequence = useSequencerStore.subscribe(dirty)
    return () => { unsubPattern(); unsubSequence(); clearTimeout(autosave.current) }
  }, [])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.code === 'Space') { event.preventDefault(); audioEngine.toggle() }
      if (event.key.toLowerCase() === 'l') { const s = usePlaybackStore.getState(); s.toggleLoop(); audioEngine.setLoop(!s.loop) }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); const d = event.shiftKey ? 5 : 1; audioEngine.seek(audioEngine.element.currentTime + (event.key === 'ArrowRight' ? d : -d)) }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveCurrentProject(false).catch(() => undefined) }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? usePatternStore.getState().redo() : usePatternStore.getState().undo() }
      if (event.key === 'Escape') { useUIStore.getState().setExportOpen(false); useUIStore.getState().setSettingsOpen(false) }
      if (event.key.toLowerCase() === 'f') document.querySelector<HTMLElement>('.canvas-workspace')?.requestFullscreen()
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])

  const editorOpen = Boolean(audio) || savedOpen
  return <div className="app-shell">
    <TopBar />
    {editorOpen ? <div className="editor-layout"><LeftSidebar /><Suspense fallback={<div className="canvas-workspace canvas-loading"><span className="spinner" /> Initializing renderer…</div>}><CanvasWorkspace /></Suspense><Inspector /><Timeline /></div> : <EmptyState />}
    {status === 'analyzing' && editorOpen && <div className="analysis-toast"><span className="spinner" /><div><b>Reading the whole track</b><small>Building waveform and detecting tempo…</small></div><em>{Math.round(usePlaybackStore.getState().progress)}%</em></div>}
    {error && editorOpen && <div className="global-error" role="alert"><span>{error}</span><button onClick={() => usePlaybackStore.getState().setError(null)}><X size={14} /></button></div>}
    <Suspense fallback={null}><ExportModal /></Suspense><SettingsModal />
  </div>
}

function SettingsModal() {
  const open = useUIStore((s) => s.settingsOpen), setOpen = useUIStore((s) => s.setSettingsOpen), quality = useUIStore((s) => s.quality), setQuality = useUIStore((s) => s.setQuality)
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={(e) => e.currentTarget === e.target && setOpen(false)}><div className="settings-modal"><header><div><p className="eyebrow">Application</p><h2>Settings</h2></div><button onClick={() => setOpen(false)}><X size={17} /></button></header><div className="settings-body"><label className="select-row"><span>Preview quality<small>Caps live pixel density</small></span><select value={quality} onChange={(e) => setQuality(e.target.value as typeof quality)}><option>Low</option><option>Medium</option><option>High</option><option>Ultra</option></select></label><label className="toggle-row"><span>Reduced motion<small>Follow system preference</small></span><input type="checkbox" defaultChecked /><i /></label><div className="shortcut-list"><h3>Keyboard</h3>{[['Space', 'Play / pause'], ['L', 'Toggle loop'], ['← / →', 'Seek 1 second'], ['Shift + ← / →', 'Seek 5 seconds'], ['Ctrl + S', 'Save'], ['F', 'Fullscreen']].map(([key, value]) => <div key={key}><kbd>{key}</kbd><span>{value}</span></div>)}</div></div></div></div>
}
