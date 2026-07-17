import { Expand, Focus, Grid3X3, Maximize2, Pause, Play, Ratio, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { PatternCanvas } from '../features/patterns/PatternCanvas'
import { useUIStore } from '../stores/uiStore'
import { usePlaybackStore } from '../stores/playbackStore'
import { audioEngine } from '../features/audio/audioEngine'
import { getPatternGenerator } from '../features/patterns/registry'
import { usePatternStore } from '../stores/patternStore'

const ratios: Record<string, string> = { Free: 'auto', '1:1': '1/1', '16:9': '16/9', '9:16': '9/16', '4:5': '4/5', '21:9': '21/9' }
export function CanvasWorkspace() {
  const shell = useRef<HTMLDivElement>(null), ratio = useUIStore((s) => s.aspectRatio), setRatio = useUIStore((s) => s.setAspectRatio), safe = useUIStore((s) => s.safeArea), setSafe = useUIStore((s) => s.setSafeArea)
  const playing = usePlaybackStore((s) => s.isPlaying), generatorId = usePatternStore((s) => s.generatorId), [zoom, setZoom] = useState(1)
  const generator = getPatternGenerator(generatorId)
  return <section className="canvas-workspace" ref={shell}>
    <div className="canvas-toolbar"><div><span className="live-dot" /> LIVE PREVIEW <b>{generator.name}</b></div><div className="canvas-tools">
      <label><Ratio size={13} /><select value={ratio} onChange={(e) => setRatio(e.target.value)}>{Object.keys(ratios).map((r) => <option key={r}>{r}</option>)}</select></label>
      <button className={safe ? 'active' : ''} onClick={() => setSafe(!safe)} title="Safe-area guides"><Grid3X3 size={14} /></button>
      <button onClick={() => setZoom(Math.max(.6, zoom - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.min(1.5, zoom + .1))}>+</button>
      <button onClick={() => setZoom(1)} title="Reset view"><RotateCcw size={14} /></button><button title="Fit canvas"><Focus size={14} /></button>
      <button onClick={() => shell.current?.requestFullscreen()} title="Fullscreen"><Maximize2 size={14} /></button>
    </div></div>
    <div className="canvas-stage">
      <div className="canvas-frame" style={{ aspectRatio: ratios[ratio], transform: `scale(${zoom})` }}>
        <PatternCanvas />{safe && <div className="safe-guide"><span /></div>}
        <button className="canvas-play" onClick={() => audioEngine.toggle()} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
        <div className="resolution-tag">1920 × 1080 <span>PREVIEW</span></div>
      </div>
    </div>
    <div className="canvas-status"><span><Expand size={12} /> Pointer interaction on</span><span>WEBGL · <b>60 FPS</b></span></div>
  </section>
}
