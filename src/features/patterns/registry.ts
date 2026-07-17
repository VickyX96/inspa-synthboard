import type { PatternGeneratorDefinition, PatternParameterDefinition, ParameterValue } from '../../types'

const n = (id: string, label: string, min: number, max: number, step: number, value: number, unit = ''): PatternParameterDefinition => ({
  id, label, type: 'number', min, max, step, defaultValue: value, unit, group: 'Shape', animatable: true, audioMappable: true,
})

const create = (
  id: string,
  name: string,
  shortName: string,
  description: string,
  category: string,
  shaderMode: number,
  params: PatternParameterDefinition[],
): PatternGeneratorDefinition => ({
  id, name, shortName, description, category, shaderMode, parameterDefinitions: params,
  defaultParameters: Object.fromEntries(params.map((p) => [p.id, p.defaultValue])) as Record<string, ParameterValue>,
})

const generators = [
  create('chladni', 'Chladni Plate', 'CH', 'Nodal harmonics carved by sound.', 'Cymatics', 0, [
    n('frequencyX', 'Frequency X', 1, 12, .1, 4.2), n('frequencyY', 'Frequency Y', 1, 12, .1, 5.1),
    n('phase', 'Phase', 0, 6.28, .01, .4, 'rad'), n('thickness', 'Thickness', .01, .3, .005, .07),
    n('scale', 'Scale', .4, 2.4, .01, 1), n('rotation', 'Rotation', -180, 180, 1, 0, '°'),
    n('warp', 'Warp', 0, 2, .01, .28), n('sharpness', 'Sharpness', .5, 8, .1, 3.5),
  ]),
  create('bars', 'Mirrored Step Bars', 'SB', 'Rhythmic architecture around a signal line.', 'Sequenced', 1, [
    n('barCount', 'Bar Count', 8, 64, 1, 28), n('amplitude', 'Amplitude', .1, 1.5, .01, .72),
    n('barWidth', 'Bar Width', .1, .95, .01, .58), n('gap', 'Gap', 0, 1, .01, .2),
    n('mirror', 'Mirror', 0, 1, .01, .82), n('smoothing', 'Smoothing', 0, 1, .01, .35),
    n('displacement', 'Displacement', -1, 1, .01, 0), n('line', 'Center Line', .002, .06, .002, .01),
  ]),
  create('radial', 'Radial Sequencer', 'RS', 'Circular steps with directional energy.', 'Radial', 2, [
    n('segments', 'Segments', 8, 72, 1, 36), n('innerRadius', 'Inner Radius', .05, .7, .01, .28),
    n('outerRadius', 'Outer Radius', .3, 1.3, .01, .82), n('rotation', 'Rotation', -180, 180, 1, -12, '°'),
    n('arc', 'Arc Coverage', .2, 1, .01, 1), n('segmentWidth', 'Segment Width', .1, .95, .01, .66),
    n('distortion', 'Radial Distortion', 0, 1.5, .01, .2), n('trail', 'Trail', 0, 1, .01, .2),
  ]),
  create('ripple', 'Ripple Field', 'RF', 'Expanding interference rings triggered by impact.', 'Fields', 3, [
    n('rippleCount', 'Ripple Count', 2, 24, 1, 9), n('speed', 'Speed', .1, 3, .01, .8),
    n('damping', 'Damping', .1, 1, .01, .7), n('thickness', 'Ring Thickness', .005, .15, .005, .035),
    n('displacement', 'Displacement', 0, 2, .01, .55), n('persistence', 'Persistence', 0, 1, .01, .62),
    n('distortion', 'Distortion', 0, 2, .01, .35), n('origin', 'Origin', -1, 1, .01, 0),
  ]),
  create('contours', 'Topographic Contours', 'TC', 'Layered terrain drifting through frequencies.', 'Fields', 4, [
    n('contours', 'Contour Count', 4, 36, 1, 17), n('noiseScale', 'Noise Scale', .2, 5, .01, 1.7),
    n('elevation', 'Elevation', 0, 2, .01, .8), n('thickness', 'Line Thickness', .005, .2, .005, .04),
    n('flow', 'Flow Speed', -.5, 2, .01, .22), n('distortion', 'Distortion', 0, 2, .01, .75),
    n('threshold', 'Threshold', 0, 1, .01, .52), n('direction', 'Direction', -3.14, 3.14, .01, .5),
  ]),
  create('particles', 'Particle Flow', 'PF', 'A responsive field of electric matter.', 'Particles', 5, [
    n('particleCount', 'Particle Count', 20, 180, 1, 92), n('flowStrength', 'Flow Strength', 0, 3, .01, .9),
    n('curl', 'Curl', 0, 4, .01, 1.2), n('attraction', 'Attraction', -2, 2, .01, .3),
    n('repulsion', 'Repulsion', 0, 2, .01, .2), n('trail', 'Trail', 0, 1, .01, .48),
    n('noise', 'Noise', 0, 3, .01, .65), n('pointSize', 'Point Size', .01, .2, .005, .055),
  ]),
]

const registry = new Map(generators.map((g) => [g.id, g]))
export const getPatternGenerator = (id: string) => registry.get(id) ?? generators[0]
export const getAllPatternGenerators = () => generators
export const registerPatternGenerator = (generator: PatternGeneratorDefinition) => registry.set(generator.id, generator)
