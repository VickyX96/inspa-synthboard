import { getPatternGenerator } from '../patterns/registry'
import { palettes, usePatternStore } from '../../stores/patternStore'

export interface FactoryPreset { id: string; name: string; generatorId: string; palette: keyof typeof palettes; values: Record<string, number> }

export const factoryPresets: FactoryPreset[] = [
  { id: 'chladni-pulse', name: 'Chladni Pulse', generatorId: 'chladni', palette: 'Graphite', values: { frequencyX: 3.8, frequencyY: 6.2, warp: .42, thickness: .055 } },
  { id: 'dark-plate', name: 'Dark Plate', generatorId: 'chladni', palette: 'Ultraviolet', values: { frequencyX: 7.2, frequencyY: 4.1, sharpness: 5.4, rotation: 18 } },
  { id: 'mirrored-rhythm', name: 'Mirrored Rhythm', generatorId: 'bars', palette: 'Graphite', values: { barCount: 32, amplitude: .65, barWidth: .48 } },
  { id: 'red-step-machine', name: 'White Step Machine', generatorId: 'bars', palette: 'High Contrast', values: { barCount: 24, amplitude: .85, barWidth: .72 } },
  { id: 'circular-signal', name: 'Circular Signal', generatorId: 'radial', palette: 'Ice', values: { segments: 48, innerRadius: .33, trail: .48 } },
  { id: 'deep-ripple', name: 'Deep Ripple', generatorId: 'ripple', palette: 'Ultraviolet', values: { rippleCount: 13, speed: .62, persistence: .82 } },
  { id: 'contour-drift', name: 'Contour Drift', generatorId: 'contours', palette: 'Graphite', values: { contours: 23, noiseScale: 1.15, flow: .12 } },
  { id: 'particle-current', name: 'Particle Current', generatorId: 'particles', palette: 'Ice', values: { particleCount: 128, curl: 1.8, flowStrength: 1.2 } },
]

export function applyPreset(preset: FactoryPreset) {
  const store = usePatternStore.getState(), generator = getPatternGenerator(preset.generatorId)
  store.hydrate({ generatorId: preset.generatorId, parameters: { ...generator.defaultParameters, ...preset.values }, appearance: { ...palettes[preset.palette] }, mappings: store.mappings })
}
