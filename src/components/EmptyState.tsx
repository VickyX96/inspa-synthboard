import { motion } from 'framer-motion'
import { CirclePlay, Clock3, Radio, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { UploadButton } from './common/UploadButton'
import { audioEngine } from '../features/audio/audioEngine'
import { usePlaybackStore } from '../stores/playbackStore'
import { useProjectStore } from '../stores/projectStore'
import { openSavedProject } from '../lib/actions'

export function EmptyState() {
  const [demoBusy, setDemoBusy] = useState(false), error = usePlaybackStore((s) => s.error), projects = useProjectStore((s) => s.projects)
  return <main className="empty-shell">
    <motion.section className="empty-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
      <div className="hero-graphic" aria-hidden="true">
        <span className="orbit orbit-a" /><span className="orbit orbit-b" /><span className="orbit orbit-c" />
        <div className="hero-mark"><img src="/assets/dispatch-mark.png" alt="Inspa Synthboard" /></div>
      </div>
      <p className="eyebrow"><span /> Procedural audio instrument</p>
      <h1>Turn sound into a<br /><em>living pattern.</em></h1>
      <p className="hero-copy">Upload a track and shape its energy into responsive, export-ready visuals. Every frequency becomes material.</p>
      <div className="hero-actions">
        <UploadButton>Upload audio</UploadButton>
        <button className="secondary-button" disabled={demoBusy} onClick={async () => { setDemoBusy(true); try { await audioEngine.loadDemo() } catch { usePlaybackStore.getState().setError('The generated tone could not be initialized.') } finally { setDemoBusy(false) } }}><CirclePlay size={15} />{demoBusy ? 'Generating…' : 'Try generated demo tone'}</button>
      </div>
      <p className="format-note">MP3, WAV, OGG, M4A, AAC or FLAC · Up to 150 MB</p>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="hero-features">
        <span><Radio size={14} /> Real-time reactive</span><span><ShieldCheck size={14} /> Private in your browser</span><span><Clock3 size={14} /> Audio-locked timing</span>
      </div>
    </motion.section>
    <aside className="empty-aside">
      <div className="aside-heading"><div><p className="eyebrow">Local library</p><h2>Your projects</h2></div><span>{projects.length}</span></div>
      {projects.length === 0 ? <div className="project-empty"><div className="project-empty-lines"><i /><i /><i /></div><h3>No projects yet</h3><p>Saved work will stay on this device and appear here.</p></div> : <div className="recent-projects">{projects.slice(0, 4).map((project) => <button key={project.id} onClick={() => openSavedProject(project)}><span className={`mini-pattern pattern-${project.generatorId}`} /><span><strong>{project.name}</strong><small>{new Date(project.updatedAt).toLocaleDateString()}</small></span></button>)}</div>}
      <div className="aside-foot"><span>01</span><p>Start with a sound.<br />The form follows.</p></div>
    </aside>
  </main>
}
