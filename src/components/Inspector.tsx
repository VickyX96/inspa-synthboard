import { ChevronDown, CircleDot, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { getPatternGenerator } from '../features/patterns/registry'
import { palettes, usePatternStore } from '../stores/patternStore'
import { useUIStore } from '../stores/uiStore'
import type { AudioMapping, ParameterValue, PatternParameterDefinition } from '../types'

const sections = ['Pattern', 'Audio Mapping', 'Sequencer', 'Appearance', 'Interaction', 'Render', 'Advanced']

export function Inspector() {
  const open = useUIStore((s) => s.inspectorSection), setOpen = useUIStore((s) => s.setInspectorSection)
  return <aside className="inspector"><div className="inspector-head"><div><p className="eyebrow">Properties</p><h2>Inspector</h2></div><span>EDIT</span></div><div className="inspector-scroll">
    {sections.map((section) => { const id = section.toLowerCase().replace(' ', '-'), active = open === id; return <section className={`inspector-section ${active ? 'open' : ''}`} key={section}>
      <button className="section-trigger" onClick={() => setOpen(active ? '' : id)}><span>{section === 'Audio Mapping' && <CircleDot size={11} />}{section}</span><ChevronDown size={14} /></button>
      {active && <div className="section-body">{id === 'pattern' ? <PatternControls /> : id === 'audio-mapping' ? <MappingControls /> : id === 'appearance' ? <AppearanceControls /> : id === 'interaction' ? <InteractionControls /> : id === 'render' ? <RenderControls /> : id === 'sequencer' ? <SequencerSummary /> : <AdvancedControls />}</div>}
    </section> })}
  </div></aside>
}

function PatternControls() {
  const generatorId = usePatternStore((s) => s.generatorId), parameters = usePatternStore((s) => s.parameters), mappings = usePatternStore((s) => s.mappings), setParameter = usePatternStore((s) => s.setParameter)
  const generator = getPatternGenerator(generatorId)
  return <><div className="generator-readout"><span className={`generator-glyph pattern-${generator.id}`}>{generator.shortName}</span><div><strong>{generator.name}</strong><small>{generator.description}</small></div></div>
    {generator.parameterDefinitions.map((definition) => <ParameterControl key={definition.id} definition={definition} value={parameters[definition.id]} mapped={mappings.some((m) => m.enabled && m.target === definition.id)} onChange={(value) => setParameter(definition.id, value)} onCommit={(value) => setParameter(definition.id, value, true)} />)}
  </>
}

function ParameterControl({ definition, value, mapped, onChange, onCommit }: { definition: PatternParameterDefinition; value: ParameterValue; mapped: boolean; onChange: (v: ParameterValue) => void; onCommit: (v: ParameterValue) => void }) {
  if (definition.type !== 'number') return null
  const number = Number(value)
  return <div className="parameter-row" onDoubleClick={() => onCommit(definition.defaultValue)}><div className="parameter-label"><span>{definition.label}{mapped && <i title="Audio mapped" />}</span><output>{Number.isInteger(definition.step) ? number : number.toFixed(2)}{definition.unit}</output></div>
    <div className="range-wrap"><input aria-label={definition.label} type="range" min={definition.min} max={definition.max} step={definition.step} value={number} onChange={(e) => onChange(Number(e.target.value))} onPointerDown={() => onCommit(number)} /><span style={{ width: `${((number - (definition.min ?? 0)) / ((definition.max ?? 1) - (definition.min ?? 0))) * 100}%` }} /></div>
  </div>
}

function MappingControls() {
  const mappings = usePatternStore((s) => s.mappings), setMappings = usePatternStore((s) => s.setMappings), add = usePatternStore((s) => s.addMapping), remove = usePatternStore((s) => s.removeMapping)
  const generator = getPatternGenerator(usePatternStore((s) => s.generatorId))
  const update = (id: string, partial: Partial<AudioMapping>) => setMappings(mappings.map((m) => m.id === id ? { ...m, ...partial } : m))
  return <><p className="section-note">Route audio features into any animatable control.</p>{mappings.map((mapping) => <div className="mapping-card" key={mapping.id}>
    <div className="mapping-top"><button className={`mapping-toggle ${mapping.enabled ? 'on' : ''}`} onClick={() => update(mapping.id, { enabled: !mapping.enabled })}><i /></button><span>{mapping.source} <b>→</b> {mapping.target}</span><button onClick={() => remove(mapping.id)}><Trash2 size={12} /></button></div>
    <div className="mapping-selects"><select value={mapping.source} onChange={(e) => update(mapping.id, { source: e.target.value as AudioMapping['source'] })}>{['rms', 'peak', 'bass', 'mid', 'treble', 'flux', 'transient', 'beat', 'progress'].map((s) => <option key={s}>{s}</option>)}</select><select value={mapping.target} onChange={(e) => update(mapping.id, { target: e.target.value })}>{generator.parameterDefinitions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
    <label className="mini-range"><span>Amount <b>{mapping.amount.toFixed(2)}</b></span><input type="range" min="-1" max="1" step=".05" value={mapping.amount} onChange={(e) => update(mapping.id, { amount: Number(e.target.value) })} /></label>
  </div>)}<button className="add-row" onClick={add}><Plus size={13} /> Add mapping</button></>
}

function AppearanceControls() {
  const appearance = usePatternStore((s) => s.appearance), set = usePatternStore((s) => s.setAppearance), apply = usePatternStore((s) => s.applyPalette)
  return <><div className="palette-list">{Object.keys(palettes).map((name) => <button key={name} onClick={() => apply(name)} title={name} style={{ background: `linear-gradient(135deg,${palettes[name].background} 50%,${palettes[name].primary} 51%)` }} />)}</div>
    {(['background', 'primary', 'secondary', 'accent'] as const).map((key) => <label className="color-row" key={key}><span>{key}</span><input type="color" value={appearance[key]} onChange={(e) => set({ [key]: e.target.value })} /><code>{appearance[key]}</code></label>)}
    {(['glow', 'grain', 'vignette'] as const).map((key) => <label className="mini-range" key={key}><span>{key}<b>{appearance[key].toFixed(2)}</b></span><input type="range" min="0" max="1" step=".01" value={appearance[key]} onChange={(e) => set({ [key]: Number(e.target.value) })} /></label>)}
  </>
}

function InteractionControls() { const value = useUIStore((s) => s.interaction), set = useUIStore((s) => s.setInteraction); return <><p className="section-note">Pointer position gently influences the live field and exported embed.</p><label className="toggle-row"><span>Interaction enabled<small>Pointer & touch</small></span><input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} /><i /></label></> }
function RenderControls() { const quality = useUIStore((s) => s.quality), set = useUIStore((s) => s.setQuality); return <><label className="select-row"><span>Quality</span><select value={quality} onChange={(e) => set(e.target.value as typeof quality)}><option>Low</option><option>Medium</option><option>High</option><option>Ultra</option></select></label><div className="metadata-grid"><span>Renderer<b>WebGL 2</b></span><span>Pixel ratio<b>≤ 2×</b></span></div></> }
function SequencerSummary() { return <><p className="section-note">Parameter lanes are edited in the bottom timeline and stay locked to project BPM.</p><button className="add-row">Open lane editor</button></> }
function AdvancedControls() { return <><p className="section-note">The renderer automatically pauses when this tab is hidden and respects reduced-motion preferences.</p><button className="text-button"><RotateCcw size={12} /> Reset generator</button></> }
