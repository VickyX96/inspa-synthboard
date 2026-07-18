import { Check, Download, Redo2, Save, Settings2, Undo2 } from 'lucide-react'
import { usePatternStore } from '../stores/patternStore'
import { usePlaybackStore } from '../stores/playbackStore'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import { formatTime } from '../lib/format'
import { saveCurrentProject } from '../features/projects/db'

export function TopBar() {
  const project = useProjectStore(), playback = usePlaybackStore(), history = usePatternStore((s) => s.history), future = usePatternStore((s) => s.future)
  const undo = usePatternStore((s) => s.undo), redo = usePatternStore((s) => s.redo)
  return <header className="topbar">
    <div className="brand"><span className="brand-icon"><img src="/assets/dispatch-mark.png" alt="" /></span><span>INSPA</span><b>SYNTHBOARD</b></div>
    <div className="top-divider" />
    <input className="project-name" aria-label="Project name" value={project.name} onChange={(e) => project.setName(e.target.value)} />
    <div className="history-controls">
      <button aria-label="Undo" disabled={!history.length} onClick={undo}><Undo2 size={15} /></button>
      <button aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 size={15} /></button>
    </div>
    <button className={`save-state state-${project.saveState}`} onClick={async () => {
      const storeAudio = project.saveState === 'unsaved' && playback.audio?.blob ? window.confirm('Store the uploaded audio inside this local project?\n\nOK: store audio locally\nCancel: reference it for this session only') : false
      await saveCurrentProject(storeAudio)
    }}>{project.saveState === 'saving' ? <span className="spinner" /> : project.saveState === 'saved' ? <Check size={13} /> : <Save size={13} />}{project.saveState}</button>
    <div className="top-spacer" />
    <div className="track-readout"><span className="status-dot" /><span>{playback.audio?.name ?? 'No audio attached'}</span><b>{formatTime(playback.currentTime)} / {formatTime(playback.duration)}</b></div>
    <button className="icon-button" aria-label="Settings" onClick={() => useUIStore.getState().setSettingsOpen(true)}><Settings2 size={16} /></button>
    <button className="export-button" onClick={() => useUIStore.getState().setExportOpen(true)}><Download size={14} /> Export</button>
  </header>
}
