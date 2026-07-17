import JSZip from 'jszip'
import { createProjectSnapshot, downloadBlob, downloadProject, slug } from '../projects/db'
import { usePatternStore } from '../../stores/patternStore'
import { getPatternGenerator } from '../patterns/registry'
import { audioEngine } from '../audio/audioEngine'

export { downloadProject }

export async function exportStill(format: 'png' | 'jpeg' | 'webp' = 'png') {
  const source = document.querySelector<HTMLCanvasElement>('#synth-canvas')
  if (!source) throw new Error('The visual canvas is not ready yet.')
  const blob = await new Promise<Blob | null>((resolve) => source.toBlob(resolve, `image/${format}`, .94))
  if (!blob) throw new Error('Your browser could not create the image.')
  downloadBlob(blob, `${slug(createProjectSnapshot().name)}.${format === 'jpeg' ? 'jpg' : format}`)
}

export async function recordVideo(seconds = 8) {
  const canvas = document.querySelector<HTMLCanvasElement>('#synth-canvas')
  if (!canvas?.captureStream || typeof MediaRecorder === 'undefined') throw new Error('Video capture is not available in this browser. Try the latest Chrome, Edge, or Firefox.')
  const stream = canvas.captureStream(30)
  const captureAudio = (audioEngine.element as HTMLAudioElement & { captureStream?: () => MediaStream }).captureStream?.()
  if (captureAudio) captureAudio.getAudioTracks().forEach((track) => stream.addTrack(track))
  const supported = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
  if (!supported) throw new Error('No supported WebM codec was found in this browser.')
  const recorder = new MediaRecorder(stream, { mimeType: supported, videoBitsPerSecond: 8_000_000 }), chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const stopped = new Promise<void>((resolve) => recorder.onstop = () => resolve())
  recorder.start(250); setTimeout(() => recorder.state === 'recording' && recorder.stop(), seconds * 1000)
  await stopped
  downloadBlob(new Blob(chunks, { type: supported }), `${slug(createProjectSnapshot().name)}.webm`)
}

export async function exportEmbedZip() {
  const zip = new JSZip(), folder = zip.folder('inspa-synthboard-embed')!
  const pattern = usePatternStore.getState(), generator = getPatternGenerator(pattern.generatorId), project = createProjectSnapshot(false)
  const config = { formatVersion: 1, generator: generator.id, mode: generator.shaderMode, parameters: pattern.parameters, appearance: pattern.appearance, bpm: project.bpm }
  folder.file('pattern.json', JSON.stringify(config, null, 2))
  folder.file('inspa-synthboard-player.js', playerRuntime)
  folder.file('inspa-synthboard-player.css', ':host{display:block;min-height:240px;background:#09090a}canvas{width:100%;height:100%;display:block}button{font:12px system-ui;color:#fff;background:#ef3d2f;border:0;padding:8px 12px}')
  folder.file('index.html', `<!doctype html><meta name="viewport" content="width=device-width"><style>html,body{margin:0;height:100%;background:#111}inspa-synthboard-player{height:100%;}</style><script type="module" src="./inspa-synthboard-player.js"></script><inspa-synthboard-player pattern="./pattern.json" audio="" loop="true" interaction="true"></inspa-synthboard-player>`)
  folder.file('README.md', `# Inspa Synthboard live embed\n\n## Basic installation\nServe this folder over HTTP and include \`inspa-synthboard-player.js\`.\n\n\`\`\`html\n<script type="module" src="./inspa-synthboard-player.js"></script>\n<inspa-synthboard-player pattern="./pattern.json" audio="./audio.mp3" loop="true"></inspa-synthboard-player>\n\`\`\`\n\nTo bind existing audio, use \`audio-selector="#site-audio"\`. The component exposes \`play()\`, \`pause()\`, \`seek(seconds)\`, \`setParameter(name,value)\`, and \`setInteractionEnabled(value)\`.\n\nBrowsers may block autoplay until the first user gesture. External audio requires CORS permission. Give the component an explicit height or aspect ratio. If the visual is blank, confirm the files are served by HTTP rather than opened from the filesystem.`)
  const source = document.querySelector<HTMLCanvasElement>('#synth-canvas')
  if (source) { const data = source.toDataURL('image/png').split(',')[1]; folder.file('thumbnail.png', data, { base64: true }) }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  downloadBlob(blob, `${slug(project.name)}-embed.zip`)
}

const playerRuntime = `
class InspaSynthboardPlayer extends HTMLElement {
  constructor(){ super(); this.root=this.attachShadow({mode:'open'}); this.root.innerHTML='<style>:host{display:block;position:relative;overflow:hidden;background:#09090a}canvas{width:100%;height:100%;display:block}</style><canvas></canvas>'; this.canvas=this.root.querySelector('canvas'); this.ctx=this.canvas.getContext('2d'); this.params={}; this.pointer={x:0,y:0}; this.running=true; }
  async connectedCallback(){ try { const r=await fetch(this.getAttribute('pattern')||'./pattern.json'); this.config=await r.json(); this.params={...this.config.parameters}; const selector=this.getAttribute('audio-selector'); this.audio=selector?document.querySelector(selector):new Audio(this.getAttribute('audio')||''); if(this.audio){this.audio.loop=this.getAttribute('loop')==='true';} this.resizeObserver=new ResizeObserver(()=>this.resize()); this.resizeObserver.observe(this); this.addEventListener('pointermove',e=>{const b=this.getBoundingClientRect();this.pointer={x:e.clientX/b.width,y:e.clientY/b.height}}); this.resize(); this.draw(); this.dispatchEvent(new CustomEvent('inspa-ready')); } catch(e){this.root.innerHTML='<p style="color:#ddd;font:13px system-ui;padding:16px">Unable to load this Inspa pattern.</p>';this.dispatchEvent(new CustomEvent('inspa-error'));} }
  resize(){const d=Math.min(devicePixelRatio||1,2),b=this.getBoundingClientRect();this.canvas.width=Math.max(1,b.width*d);this.canvas.height=Math.max(1,b.height*d);this.ctx.setTransform(d,0,0,d,0,0)}
  draw(){if(!this.running)return; const c=this.ctx,w=this.clientWidth,h=this.clientHeight,t=this.audio?.currentTime||performance.now()/1000,a=this.config.appearance;c.fillStyle=a.background;c.fillRect(0,0,w,h);c.strokeStyle=a.primary;c.fillStyle=a.primary;c.lineWidth=1.5;const m=this.config.mode||0;
    if(m===0){c.save();c.translate(w/2,h/2);const sx=this.params.frequencyX||4.2,sy=this.params.frequencyY||5.1;for(let ring=1;ring<10;ring++){c.beginPath();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,x=Math.sin(a*sx+t*.15)*w*.04*ring,y=Math.sin(a*sy)*h*.035*ring;i?c.lineTo(x,y):c.moveTo(x,y)}c.globalAlpha=.16+ring*.06;c.stroke()}c.restore()}
    else if(m===1){const n=this.params.barCount||28;for(let i=0;i<n;i++){const x=i*w/n,amp=(.18+.7*Math.abs(Math.sin(i*.71-t*2)))*(this.params.amplitude||.7)*h*.42;c.fillRect(x,h/2-amp,w/n*(this.params.barWidth||.6),amp*2)}}
    else if(m===2){const n=this.params.segments||36;c.save();c.translate(w/2,h/2);for(let i=0;i<n;i++){c.rotate(Math.PI*2/n);const q=20+Math.abs(Math.sin(i*1.2-t*2))*Math.min(w,h)*.22;c.fillRect(Math.min(w,h)*.13,0,q,2)}c.restore()}
    else if(m===3){c.save();c.translate(w*(.5+(this.pointer.x-.5)*.1),h*(.5+(this.pointer.y-.5)*.1));for(let i=0;i<(this.params.rippleCount||9);i++){c.beginPath();c.arc(0,0,Math.abs(((t*50+i*35)%(Math.max(w,h)*.7))),0,7);c.stroke()}c.restore()}
    else if(m===4){const levels=this.params.contours||17;c.globalAlpha=.65;for(let j=0;j<levels;j++){c.beginPath();for(let i=0;i<=90;i++){const x=i/90*w,y=h*(.12+j/(levels+3)*.78)+Math.sin(i*.22+j*1.7+t*(this.params.flow||.2))*h*.035+Math.sin(i*.07-j)*h*.025;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}}
    else {for(let i=0;i<80;i++){const x=(Math.sin(i*19.3+t*.2)+1)*w/2,y=(Math.cos(i*7.7+t*.17)+1)*h/2;c.beginPath();c.arc(x,y,1.2+(i%3),0,7);c.fill()}}
    requestAnimationFrame(()=>this.draw()) }
  play(){return this.audio?.play()} pause(){this.audio?.pause()} seek(v){if(this.audio)this.audio.currentTime=v} setParameter(k,v){this.params[k]=v} setInteractionEnabled(v){this.interaction=!!v} destroy(){this.running=false;this.resizeObserver?.disconnect();this.audio?.pause();this.remove()} disconnectedCallback(){this.running=false;this.resizeObserver?.disconnect()}
}
customElements.define('inspa-synthboard-player',InspaSynthboardPlayer);
window.addEventListener('message',e=>{const p=document.querySelector('inspa-synthboard-player');if(!p||!e.data)return;const {command,value}=e.data;if(command==='play')p.play();if(command==='pause')p.pause();if(command==='seek')p.seek(value);if(command==='setParameter')p.setParameter(e.data.parameter,value);if(command==='setInteractionEnabled')p.setInteractionEnabled(value)});`
