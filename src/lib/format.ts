export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00.0'
  const m = Math.floor(seconds / 60), s = seconds % 60
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`
}
