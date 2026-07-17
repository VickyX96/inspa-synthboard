import type { AudioFrame, OfflineAnalysis } from '../../types'
import { usePlaybackStore } from '../../stores/playbackStore'

const EMPTY_FRAME: AudioFrame = { time: 0, deltaTime: 0, progress: 0, rms: 0, peak: 0, sub: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0, centroid: 0, flux: 0, transient: 0, beat: 0, onset: 0 }

const waitFor = (target: EventTarget, event: string, errorEvent = 'error') => new Promise<void>((resolve, reject) => {
  const onReady = () => { cleanup(); resolve() }
  const onError = () => { cleanup(); reject(new Error('This audio file could not be decoded by your browser.')) }
  const cleanup = () => { target.removeEventListener(event, onReady); target.removeEventListener(errorEvent, onError) }
  target.addEventListener(event, onReady, { once: true }); target.addEventListener(errorEvent, onError, { once: true })
})

class AudioEngine {
  readonly element = new Audio()
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private gain: GainNode | null = null
  private frequencies = new Uint8Array(1024)
  private waveform = new Uint8Array(2048)
  private lastSpectrum = new Float32Array(1024)
  private lastTime = 0
  private objectUrl: string | null = null
  private tickHandle = 0

  constructor() {
    this.element.preload = 'auto'
    this.element.crossOrigin = 'anonymous'
    this.element.addEventListener('play', () => { usePlaybackStore.getState().setPlaying(true); this.startTick() })
    this.element.addEventListener('pause', () => usePlaybackStore.getState().setPlaying(false))
    this.element.addEventListener('ended', () => usePlaybackStore.getState().setPlaying(false))
    this.element.addEventListener('durationchange', () => usePlaybackStore.getState().setTime(this.element.currentTime, this.element.duration || 0))
  }

  private async ensureGraph() {
    if (!this.context) {
      this.context = new AudioContext()
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = .72
      this.gain = this.context.createGain()
      this.source = this.context.createMediaElementSource(this.element)
      this.source.connect(this.analyser).connect(this.gain).connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
  }

  async loadFile(file: File | Blob, name?: string, isDemo = false) {
    const store = usePlaybackStore.getState()
    if (file.size > 150 * 1024 * 1024) throw new Error('That file is over 150 MB. Choose a shorter or compressed track.')
    const type = file.type || 'audio/wav'
    if (!type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name ?? '')) throw new Error('Choose a browser-compatible audio file such as MP3, WAV, OGG, M4A, AAC, or FLAC.')
    this.pause()
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = URL.createObjectURL(file)
    this.element.src = this.objectUrl
    this.element.load()
    await waitFor(this.element, 'loadedmetadata')
    const duration = Number.isFinite(this.element.duration) ? this.element.duration : 0
    store.setAudio({ name: name || (file instanceof File ? file.name : 'Generated demo tone.wav'), type, size: file.size, duration, url: this.objectUrl, blob: file, isDemo })
    store.setTime(0, duration)
    store.setStatus('analyzing', 5)
    try {
      const analysis = await analyzeAudio(file, (progress) => usePlaybackStore.getState().setStatus('analyzing', progress))
      store.setAnalysis(analysis)
      store.setStatus('ready', 100)
      return analysis
    } catch {
      const fallback = { waveform: Array.from({ length: 320 }, (_, i) => .15 + Math.abs(Math.sin(i * .2)) * .35), bpm: 120, confidence: .2, beats: [], duration, peaks: [] }
      store.setAnalysis(fallback)
      store.setStatus('ready', 100)
      return fallback
    }
  }

  async loadDemo() {
    const blob = createDemoTone()
    return this.loadFile(blob, 'Inspa generated tone.wav', true)
  }

  async play() {
    await this.ensureGraph()
    await this.element.play()
  }
  pause() { this.element.pause() }
  toggle() { return this.element.paused ? this.play() : (this.pause(), Promise.resolve()) }
  seek(time: number) { this.element.currentTime = Math.max(0, Math.min(time, this.element.duration || 0)); usePlaybackStore.getState().setTime(this.element.currentTime) }
  setLoop(loop: boolean) { this.element.loop = loop }
  setMuted(muted: boolean) { this.element.muted = muted }
  setVolume(volume: number) { this.element.volume = Math.max(0, Math.min(1, volume)) }

  getFrame(): AudioFrame {
    const duration = this.element.duration || 0
    const time = this.element.currentTime || 0
    if (!this.analyser || this.element.paused) return { ...EMPTY_FRAME, time, deltaTime: Math.max(0, time - this.lastTime), progress: duration ? time / duration : 0 }
    this.analyser.getByteFrequencyData(this.frequencies)
    this.analyser.getByteTimeDomainData(this.waveform)
    const sr = this.context?.sampleRate ?? 44100
    const hzPerBin = sr / this.analyser.fftSize
    const band = (from: number, to: number) => {
      const a = Math.max(0, Math.floor(from / hzPerBin)), b = Math.min(this.frequencies.length - 1, Math.ceil(to / hzPerBin))
      let sum = 0; for (let i = a; i <= b; i++) sum += this.frequencies[i] / 255
      return Math.min(1, sum / Math.max(1, b - a + 1) * 1.35)
    }
    let square = 0, peak = 0, flux = 0, weighted = 0, total = 0
    for (let i = 0; i < this.waveform.length; i++) { const v = (this.waveform[i] - 128) / 128; square += v * v; peak = Math.max(peak, Math.abs(v)) }
    for (let i = 0; i < this.frequencies.length; i++) { const v = this.frequencies[i] / 255; const d = v - this.lastSpectrum[i]; if (d > 0) flux += d; this.lastSpectrum[i] = v; weighted += i * hzPerBin * v; total += v }
    const rms = Math.min(1, Math.sqrt(square / this.waveform.length) * 2.4)
    flux = Math.min(1, flux / 35)
    const transient = Math.min(1, flux * 2.4 + Math.max(0, peak - rms) * .5)
    const bpm = usePlaybackStore.getState().analysis?.bpm ?? 120
    const beatPhase = ((time * bpm / 60) % 1)
    const deltaTime = Math.max(0, time - this.lastTime)
    this.lastTime = time
    return { time, deltaTime, progress: duration ? time / duration : 0, rms, peak, sub: band(20, 60), bass: band(60, 250), lowMid: band(250, 500), mid: band(500, 2000), highMid: band(2000, 6000), treble: band(6000, 20000), centroid: total ? Math.min(1, weighted / total / 10000) : 0, flux, transient, beat: Math.exp(-beatPhase * 10), onset: transient > .48 ? 1 : 0 }
  }

  private startTick() {
    cancelAnimationFrame(this.tickHandle)
    const tick = () => {
      usePlaybackStore.getState().setTime(this.element.currentTime, this.element.duration || 0)
      if (!this.element.paused) this.tickHandle = requestAnimationFrame(tick)
    }
    tick()
  }
}

async function analyzeAudio(blob: Blob, onProgress: (p: number) => void): Promise<OfflineAnalysis> {
  onProgress(12)
  const buffer = await blob.arrayBuffer()
  onProgress(28)
  const context = new OfflineAudioContext(1, 1, 44100)
  const audio = await context.decodeAudioData(buffer.slice(0))
  onProgress(56)
  const channel = audio.getChannelData(0)
  const buckets = 560, waveform: number[] = [], peaks: number[] = []
  const stride = Math.max(1, Math.floor(channel.length / buckets))
  for (let i = 0; i < buckets; i++) {
    let max = 0, energy = 0
    const start = i * stride, end = Math.min(channel.length, start + stride)
    for (let j = start; j < end; j += Math.max(1, Math.floor(stride / 120))) { const a = Math.abs(channel[j]); max = Math.max(max, a); energy += a * a }
    waveform.push(Math.min(1, max * 1.3)); if (max > .82) peaks.push(i / buckets * audio.duration)
  }
  onProgress(76)
  const bpm = estimateBpm(channel, audio.sampleRate)
  const beatGap = 60 / bpm.value
  const beats = Array.from({ length: Math.ceil(audio.duration / beatGap) }, (_, i) => i * beatGap)
  onProgress(100)
  return { waveform, bpm: bpm.value, confidence: bpm.confidence, beats, duration: audio.duration, peaks }
}

function estimateBpm(data: Float32Array, sampleRate: number) {
  const hop = Math.max(512, Math.floor(sampleRate / 100)); const env: number[] = []
  for (let i = 0; i < data.length; i += hop) { let e = 0; for (let j = i; j < Math.min(data.length, i + hop); j += 8) e += data[j] * data[j]; env.push(e) }
  const rate = sampleRate / hop; let best = 120, bestScore = 0, total = 0
  for (let bpm = 72; bpm <= 168; bpm++) { const lag = Math.round(rate * 60 / bpm); let score = 0; for (let i = lag; i < env.length; i++) score += env[i] * env[i - lag]; total += score; if (score > bestScore) { bestScore = score; best = bpm } }
  return { value: best, confidence: total ? Math.min(.98, bestScore / (total / 97) / 5) : .2 }
}

function createDemoTone() {
  const sampleRate = 44100, duration = 24, length = sampleRate * duration
  const samples = new Float32Array(length); const bpm = 124, beat = 60 / bpm
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate, step = Math.floor(t / (beat / 2)), local = t % beat
    const bassFreq = [55, 65.41, 73.42, 49][Math.floor(t / (beat * 4)) % 4]
    const kick = Math.sin(2 * Math.PI * (48 + 70 * Math.exp(-local * 28)) * t) * Math.exp(-local * 14)
    const bass = Math.sin(2 * Math.PI * bassFreq * t + Math.sin(t * .7) * .3) * (.28 + .18 * Math.sin(Math.PI * Math.min(1, local / beat)))
    const hatLocal = t % (beat / 2); const hat = (Math.sin(i * 1.754) + Math.sin(i * 2.143)) * .06 * Math.exp(-hatLocal * 40)
    const pulse = step % 4 === 2 ? Math.sin(2 * Math.PI * 220 * t) * Math.exp(-hatLocal * 18) * .16 : 0
    samples[i] = Math.tanh((kick * .7 + bass + hat + pulse) * .8)
  }
  const view = new DataView(new ArrayBuffer(44 + samples.length * 2)); let o = 0
  const str = (s: string) => { for (const c of s) view.setUint8(o++, c.charCodeAt(0)) }
  str('RIFF'); view.setUint32(o, 36 + samples.length * 2, true); o += 4; str('WAVEfmt '); view.setUint32(o, 16, true); o += 4; view.setUint16(o, 1, true); o += 2; view.setUint16(o, 1, true); o += 2; view.setUint32(o, sampleRate, true); o += 4; view.setUint32(o, sampleRate * 2, true); o += 4; view.setUint16(o, 2, true); o += 2; view.setUint16(o, 16, true); o += 2; str('data'); view.setUint32(o, samples.length * 2, true); o += 4
  for (const sample of samples) { view.setInt16(o, Math.max(-1, Math.min(1, sample)) * 0x7fff, true); o += 2 }
  return new Blob([view], { type: 'audio/wav' })
}

export const audioEngine = new AudioEngine()
