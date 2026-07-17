import { useEffect, useRef } from 'react'
import { usePlaybackStore } from '../../stores/playbackStore'
import { audioEngine } from './audioEngine'

export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analysis = usePlaybackStore((s) => s.analysis)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const duration = usePlaybackStore((s) => s.duration)

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !analysis) return
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1)
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.scale(dpr, dpr); const w = rect.width, h = rect.height, middle = h / 2
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#171719'; ctx.fillRect(0, 0, w, h)
    const progress = duration ? currentTime / duration : 0
    const count = analysis.waveform.length
    for (let i = 0; i < count; i++) {
      const x = i / count * w, amp = analysis.waveform[i] * h * .42
      ctx.fillStyle = i / count <= progress ? '#b8322a' : '#4a4a4d'
      ctx.fillRect(x, middle - amp, Math.max(1, w / count - .7), amp * 2)
    }
    const beatGap = 60 / analysis.bpm
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1
    for (let t = 0; t < duration; t += beatGap * 4) { const x = t / duration * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    const x = progress * w; ctx.strokeStyle = '#f04436'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }, [analysis, currentTime, duration])

  return <canvas ref={canvasRef} className="waveform-canvas" aria-label="Audio waveform. Click to seek." onPointerDown={(e) => {
    const rect = e.currentTarget.getBoundingClientRect(); audioEngine.seek((e.clientX - rect.left) / rect.width * duration)
  }} />
}
