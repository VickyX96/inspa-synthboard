import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { audioEngine } from '../audio/audioEngine'
import { getPatternGenerator } from './registry'
import { usePatternStore } from '../../stores/patternStore'
import { useSequencerStore } from '../../stores/sequencerStore'
import { useUIStore } from '../../stores/uiStore'
import type { AudioFrame, AudioSource } from '../../types'

const vertexShader = `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position,1.0); }
`

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uMode;
uniform float uP[8];
uniform vec4 uAudio;
uniform vec2 uPointer;
uniform vec3 uBg;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;
uniform float uGlow;
uniform float uGrain;
uniform float uVignette;

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y); }
mat2 rot(float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
float line(float d,float w){ return 1.0-smoothstep(w,w*2.0,abs(d)); }

float chladni(vec2 p){
  p*=uP[4]+uAudio.x*.22; p*=rot(radians(uP[5])); p+=sin(p.yx*3.0+uTime)*uP[6]*.08;
  float a=sin(p.x*3.14159*uP[0]+uP[2])*sin(p.y*3.14159*uP[1]);
  float b=sin(p.x*3.14159*uP[1])*sin(p.y*3.14159*uP[0]+uP[2]);
  return pow(line(abs(a-b),uP[3]+uAudio.z*.025),max(.3,uP[7]*.42));
}
float bars(vec2 p){
  float count=max(4.0,uP[0]); float x=(p.x*.5+.5+uP[6]*.1)*count; float id=floor(x); float cell=abs(fract(x)-.5)*2.0;
  float rhythm=.25+.5*hash21(vec2(id,3.2))+.22*sin(id*.7-uTime*2.0); rhythm=clamp(rhythm,0.06,1.0);
  float amp=uP[1]*(.55+uAudio.x*.8); float h=rhythm*amp; float edge=smoothstep(.04,.0,abs(abs(p.y)-h));
  float bar=step(cell,clamp(uP[2],.08,.96))*step(abs(p.y),h); float center=line(p.y,uP[7]);
  return max(bar*(.72+.28*edge),center);
}
float radial(vec2 p){
  p*=rot(radians(uP[3])+uTime*.08); float a=atan(p.y,p.x)/6.28318+.5; float seg=fract(a*uP[0]); float id=floor(a*uP[0]);
  float pulse=.65+.35*sin(id*1.7-uTime*2.0)+uAudio.y*.45; float r=length(p); float outer=mix(uP[1],uP[2],clamp(pulse,0.0,1.0));
  float ring=step(uP[1],r)*step(r,outer)*step(abs(seg-.5)*2.0,uP[5]); return ring*step(a,clamp(uP[4],.2,1.0));
}
float ripple(vec2 p){
  vec2 origin=vec2(uP[7]*.25,0.0)+uPointer*.08; float r=length(p-origin); float bend=noise(p*3.0+uTime*.12)*uP[6]*.12;
  float waves=sin((r+bend)*uP[0]*9.0-uTime*uP[1]*5.0-uAudio.w*2.0); float rings=line(waves,clamp(uP[3]*4.0,.02,.5));
  return rings*exp(-r*(1.4-uP[5]*.7))*(.65+uAudio.x*.6);
}
float contour(vec2 p){
  p*=rot(uP[7]); float ns=max(.2,uP[1]); float n=noise(p*ns*2.0+vec2(uTime*uP[4],0.0)); n+=noise(p*ns*4.0-vec2(0.0,uTime*.08))*.45*uP[5];
  float levels=abs(fract(n*uP[0])-.5); return 1.0-smoothstep(uP[3],uP[3]+.08,levels);
}
float particles(vec2 p){
  float cells=sqrt(max(16.0,uP[0])); vec2 q=p*.5+.5; vec2 id=floor(q*cells); vec2 gv=fract(q*cells)-.5;
  float h=hash21(id); vec2 drift=vec2(sin(h*18.0+uTime*uP[1]),cos(h*23.0+uTime*(.6+uP[2]*.2)))*.28;
  drift+=uPointer*.14*uP[3]; float d=length(gv-drift); return smoothstep(uP[7]*.85,0.0,d)*(.45+.55*sin(h*20.0+uTime*3.0));
}
void main(){
  vec2 p=(vUv-.5)*2.0; p.x*=1.35; float f=0.0;
  if(uMode<.5) f=chladni(p); else if(uMode<1.5) f=bars(p); else if(uMode<2.5) f=radial(p); else if(uMode<3.5) f=ripple(p); else if(uMode<4.5) f=contour(p); else f=particles(p);
  f=clamp(f,0.0,1.0); vec3 color=mix(uBg,mix(uSecondary,uPrimary,smoothstep(.05,.72,f)),f);
  color+=uAccent*pow(f,3.0)*uGlow*(.5+uAudio.w); float vig=1.0-dot(p*.55,p*.55)*uVignette; color*=clamp(vig,.25,1.0);
  color+=(hash21(gl_FragCoord.xy+uTime)-.5)*uGrain*.05;
  gl_FragColor=vec4(color,1.0);
}
`

const sourceValue = (frame: AudioFrame, source: AudioSource) => frame[source] ?? 0

function VisualPlane() {
  const material = useRef<THREE.ShaderMaterial>(null)
  const pointer = useRef(new THREE.Vector2())
  const generatorId = usePatternStore((s) => s.generatorId)
  const parameters = usePatternStore((s) => s.parameters)
  const mappings = usePatternStore((s) => s.mappings)
  const appearance = usePatternStore((s) => s.appearance)
  const interaction = useUIStore((s) => s.interaction)
  const generator = getPatternGenerator(generatorId)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uMode: { value: generator.shaderMode }, uP: { value: new Float32Array(8) },
    uAudio: { value: new THREE.Vector4() }, uPointer: { value: new THREE.Vector2() },
    uBg: { value: new THREE.Color(appearance.background) }, uPrimary: { value: new THREE.Color(appearance.primary) },
    uSecondary: { value: new THREE.Color(appearance.secondary) }, uAccent: { value: new THREE.Color(appearance.accent) },
    uGlow: { value: appearance.glow }, uGrain: { value: appearance.grain }, uVignette: { value: appearance.vignette },
  }), [])

  useFrame((state) => {
    if (!material.current) return
    const frame = audioEngine.getFrame(); const params = { ...parameters }
    for (const mapping of mappings) {
      if (!mapping.enabled || typeof params[mapping.target] !== 'number') continue
      let v = sourceValue(frame, mapping.source); if (mapping.invert) v = 1 - v
      v = mapping.min + v * (mapping.max - mapping.min) * mapping.amount
      params[mapping.target] = mapping.mode === 'replace' ? v : Number(params[mapping.target]) + v
    }
    const sequence = useSequencerStore.getState(); const beat = frame.time * sequence.bpm / 60
    const index = Math.floor(beat * 4) % sequence.steps
    for (const lane of sequence.lanes) if (lane.enabled && typeof params[lane.parameter] === 'number') params[lane.parameter] = Number(params[lane.parameter]) * (.65 + Math.abs(lane.values[index] ?? .5) * .7)
    const p = generator.parameterDefinitions.slice(0, 8).map((d) => Number(params[d.id] ?? d.defaultValue))
    material.current.uniforms.uP.value.set(p)
    material.current.uniforms.uTime.value = frame.time
    material.current.uniforms.uMode.value = generator.shaderMode
    material.current.uniforms.uAudio.value.set(frame.bass, frame.mid, frame.treble, Math.max(frame.transient, frame.beat))
    material.current.uniforms.uBg.value.set(appearance.background); material.current.uniforms.uPrimary.value.set(appearance.primary)
    material.current.uniforms.uSecondary.value.set(appearance.secondary); material.current.uniforms.uAccent.value.set(appearance.accent)
    material.current.uniforms.uGlow.value = appearance.glow; material.current.uniforms.uGrain.value = appearance.grain; material.current.uniforms.uVignette.value = appearance.vignette
    pointer.current.lerp(interaction ? state.pointer : new THREE.Vector2(), .08); material.current.uniforms.uPointer.value.copy(pointer.current)
  })
  return <mesh><planeGeometry args={[2, 2]} /><shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} /></mesh>
}

export function PatternCanvas() {
  return <Canvas id="synth-canvas" orthographic camera={{ position: [0, 0, 1], zoom: 1 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}>
    <VisualPlane />
  </Canvas>
}
