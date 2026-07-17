import { AudioLines, Copy, FileAudio, FolderKanban, MoreHorizontal, Plus, Shapes, SlidersHorizontal, Trash2 } from 'lucide-react'
import { getAllPatternGenerators } from '../features/patterns/registry'
import { usePatternStore } from '../stores/patternStore'
import { useUIStore, type LeftTab } from '../stores/uiStore'
import { UploadButton } from './common/UploadButton'
import { usePlaybackStore } from '../stores/playbackStore'
import { factoryPresets, applyPreset } from '../features/presets/presets'
import { deleteProject, duplicateProject, downloadProject } from '../features/projects/db'
import { useProjectStore } from '../stores/projectStore'
import { openSavedProject } from '../lib/actions'
import { audioEngine } from '../features/audio/audioEngine'

const tabs: { id: LeftTab; label: string; icon: typeof FolderKanban }[] = [
  { id: 'projects', label: 'Projects', icon: FolderKanban }, { id: 'audio', label: 'Audio', icon: AudioLines },
  { id: 'patterns', label: 'Patterns', icon: Shapes }, { id: 'presets', label: 'Presets', icon: SlidersHorizontal },
]

export function LeftSidebar() {
  const active = useUIStore((s) => s.leftTab), setActive = useUIStore((s) => s.setLeftTab)
  return <aside className="left-shell">
    <nav className="rail" aria-label="Workspace panels">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)} title={label}><Icon size={18} /><span>{label}</span></button>)}</nav>
    <section className="left-panel">
      {active === 'projects' && <ProjectsPanel />}
      {active === 'audio' && <AudioPanel />}
      {active === 'patterns' && <PatternsPanel />}
      {active === 'presets' && <PresetsPanel />}
    </section>
  </aside>
}

function PanelTitle({ children, action }: { children: string; action?: React.ReactNode }) { return <div className="panel-title"><div><p className="eyebrow">Library</p><h2>{children}</h2></div>{action}</div> }

function ProjectsPanel() {
  const projects = useProjectStore((s) => s.projects)
  return <><PanelTitle action={<button className="tiny-button"><Plus size={13} /> New</button>}>Projects</PanelTitle>
    <div className="panel-scroll">{projects.length ? projects.map((project) => <div className="project-card" key={project.id}>
      <button className={`project-thumb pattern-${project.generatorId}`} onClick={() => openSavedProject(project)} aria-label={`Open ${project.name}`} />
      <div><strong>{project.name}</strong><small>{new Date(project.updatedAt).toLocaleDateString()}</small></div>
      <details className="overflow-menu"><summary><MoreHorizontal size={15} /></summary><div><button onClick={() => openSavedProject(project)}>Open</button><button onClick={() => duplicateProject(project)}><Copy size={12} /> Duplicate</button><button onClick={() => downloadProject(project)}>Export project</button><button className="danger" onClick={() => window.confirm(`Delete “${project.name}”?`) && deleteProject(project.id)}><Trash2 size={12} /> Delete</button></div></details>
    </div>) : <div className="compact-empty"><FolderKanban size={20} /><p>No local projects</p><small>Save this pattern to add it here.</small></div>}</div>
  </>
}

function AudioPanel() {
  const audio = usePlaybackStore((s) => s.audio), status = usePlaybackStore((s) => s.status), progress = usePlaybackStore((s) => s.progress), analysis = usePlaybackStore((s) => s.analysis)
  return <><PanelTitle>Audio</PanelTitle><div className="panel-scroll">
    {audio ? <div className="audio-card"><div className="audio-file-icon"><FileAudio size={22} /></div><div><strong>{audio.name}</strong><small>{(audio.size / 1024 / 1024).toFixed(1)} MB · {audio.type.replace('audio/', '').toUpperCase()}</small></div></div> : <div className="compact-empty"><FileAudio size={20} /><p>No audio attached</p></div>}
    {status === 'analyzing' && <div className="analysis-progress"><span><b>Analyzing track</b><em>{Math.round(progress)}%</em></span><i><u style={{ width: `${progress}%` }} /></i></div>}
    {analysis && <div className="metadata-grid"><span>Duration<b>{analysis.duration.toFixed(1)}s</b></span><span>Tempo<b>{analysis.bpm} BPM</b></span><span>Confidence<b>{Math.round(analysis.confidence * 100)}%</b></span><span>Peaks<b>{analysis.peaks.length}</b></span></div>}
    <UploadButton className="secondary-button full-width">{audio ? 'Replace audio' : 'Upload audio'}</UploadButton>
    {audio && <button className="text-button danger" onClick={() => { audioEngine.pause(); usePlaybackStore.getState().reset() }}><Trash2 size={13} /> Remove audio</button>}
    <div className="info-note"><span>LOCAL</span><p>Audio analysis stays in this browser. Nothing is uploaded.</p></div>
  </div></>
}

function PatternsPanel() {
  const current = usePatternStore((s) => s.generatorId), set = usePatternStore((s) => s.setGenerator)
  return <><PanelTitle>Pattern engines</PanelTitle><div className="pattern-grid panel-scroll">{getAllPatternGenerators().map((g, i) => <button key={g.id} className={`pattern-tile ${current === g.id ? 'active' : ''}`} onClick={() => set(g.id)}>
    <span className={`pattern-preview pattern-${g.id}`}><i>{String(i + 1).padStart(2, '0')}</i></span><strong>{g.name}</strong><small>{g.category}</small>
  </button>)}</div></>
}

function PresetsPanel() {
  return <><PanelTitle>Factory presets</PanelTitle><div className="preset-list panel-scroll">{factoryPresets.map((preset) => <button key={preset.id} onClick={() => applyPreset(preset)}><span className={`preset-swatch pattern-${preset.generatorId}`} /><span><strong>{preset.name}</strong><small>{preset.palette}</small></span></button>)}</div></>
}
