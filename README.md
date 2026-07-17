# Inspa Synthboard

A browser-native procedural audio-visual instrument built with React 19, TypeScript, Vite, Zustand, Three.js / React Three Fiber, GLSL, Web Audio, Dexie, JSZip, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run typecheck
npm test
npm run build
```

## Adding a pattern engine

Add a `PatternGeneratorDefinition` to `src/features/patterns/registry.ts`, including its parameter schema and numeric shader mode. Implement the corresponding shader branch in `PatternCanvas.tsx`. The pattern browser and inspector are generated from the registry, so no editor-specific UI branch is required.

High-frequency audio frames are read by the render loop from `audioEngine`; they intentionally do not pass through React state.
