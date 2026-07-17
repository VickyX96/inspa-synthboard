import { ChevronUp, Dice5, Repeat2, Pause, Play, Plus, SkipBack, Volume2, VolumeX, ZoomIn } from 'lucide-react'
import { Waveform } from '../features/audio/Waveform'
import { audioEngine } from '../features/audio/audioEngine'
import { usePlaybackStore } from '../stores/playbackStore'
import { useSequencerStore } from '../stores/sequencerStore'
import { formatTime } from '../lib/format'

export function Timeline() {
  const playback = usePlaybackStore(), sequence = useSequencerStore()
  const currentStep = Math.floor(playback.currentTime * sequence.bpm / 60 * 4) % sequence.steps
  return <section className="timeline">
    <div className="resize-handle"><i /><ChevronUp size={12} /></div>
      <div className="timeline-top"><div className="transport"><button onClick={() => audioEngine.seek(0)}><SkipBack size={14} /></button><button className="transport-play" onClick={() => audioEngine.toggle()}>{playback.isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button><button className={playback.loop ? 'active' : ''} onClick={() => { playback.toggleLoop(); audioEngine.setLoop(!playback.loop) }}><Repeat2 size={14} /></button><b>{formatTime(playback.currentTime)}</b><span>/ {formatTime(playback.duration)}</span></div>
      <div className="timeline-settings"><label>BPM <input type="number" min="40" max="240" value={sequence.bpm} onChange={(e) => sequence.setBpm(Number(e.target.value))} /></label><label>STEPS <select value={sequence.steps} onChange={(e) => sequence.setSteps(Number(e.target.value) as 8 | 16 | 32 | 64)}><option>8</option><option>16</option><option>32</option><option>64</option></select></label><button><ZoomIn size={13} /> 100%</button><button onClick={() => { playback.toggleMute(); audioEngine.setMuted(!playback.muted) }}>{playback.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button></div>
    </div>
    <div className="waveform-row"><div className="track-label"><span>01</span><div><b>AUDIO</b><small>{playback.audio?.name ?? 'No audio attached'}</small></div></div><div className="waveform-wrap"><Waveform /></div></div>
    <div className="sequence-editor"><div className="sequence-label"><span>PARAMETER LANES</span><button onClick={() => sequence.addLane()}><Plus size={12} /> Lane</button></div><div className="lanes">{sequence.lanes.map((lane) => <div className="lane" key={lane.id}><div className="lane-name"><i className={lane.enabled ? 'on' : ''} /><span>{lane.name}</span><button title="Randomize lane" onClick={() => sequence.randomize(lane.id)}><Dice5 size={12} /></button></div><div className="steps">{lane.values.map((value, index) => <button key={index} className={currentStep === index ? 'playing' : ''} onPointerDown={(e) => {
          const el = e.currentTarget, startY = e.clientY, original = value
          const move = (ev: PointerEvent) => sequence.setStep(lane.id, index, Math.max(lane.bipolar ? -1 : 0, Math.min(1, original + (startY - ev.clientY) / 70)))
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
          window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
        }} title={`${lane.name} step ${index + 1}: ${value.toFixed(2)}`}><i style={{ height: `${Math.abs(value) * 100}%`, transform: lane.bipolar && value < 0 ? 'scaleY(-1)' : undefined }} /></button>)}</div></div>)}</div></div>
  </section>
}
