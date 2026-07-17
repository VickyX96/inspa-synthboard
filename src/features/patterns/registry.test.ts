import { describe, expect, it } from 'vitest'
import { getAllPatternGenerators, getPatternGenerator } from './registry'

describe('pattern registry', () => {
  it('ships six functional generator definitions', () => {
    expect(getAllPatternGenerators()).toHaveLength(6)
    expect(new Set(getAllPatternGenerators().map((g) => g.id)).size).toBe(6)
  })
  it('provides typed defaults for every parameter', () => {
    const generator = getPatternGenerator('chladni')
    expect(generator.parameterDefinitions.every((p) => generator.defaultParameters[p.id] !== undefined)).toBe(true)
  })
})
