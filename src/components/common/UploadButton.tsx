import { useRef, useState, type ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { audioEngine } from '../../features/audio/audioEngine'
import { usePlaybackStore } from '../../stores/playbackStore'

export function UploadButton({ children, className = 'primary-button' }: { children?: ReactNode; className?: string }) {
  const input = useRef<HTMLInputElement>(null), [busy, setBusy] = useState(false)
  return <>
    <button className={className} type="button" disabled={busy} onClick={() => input.current?.click()}><Upload size={15} />{busy ? 'Analyzing…' : children ?? 'Upload audio'}</button>
    <input ref={input} hidden type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" onChange={async (e) => {
      const file = e.target.files?.[0]; if (!file) return
      setBusy(true); usePlaybackStore.getState().setError(null)
      try { await audioEngine.loadFile(file) } catch (error) { usePlaybackStore.getState().setError(error instanceof Error ? error.message : 'The audio file could not be loaded.') }
      finally { setBusy(false); e.target.value = '' }
    }} />
  </>
}
