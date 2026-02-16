# Node Editor Canvas — Grid Playground

An interactive node editor canvas with draggable physics panels, connection wiring, visual effects overlays, and a modular tool system.

## ░░ Architecture ░░

```
src/
├── components/
│   ├── grid/
│   │   ├── GridPlayground.tsx      ░░ Main orchestrator — state, events, layout
│   │   ├── DotGridCanvas.tsx       ░░ Canvas rendering — dots, grid, particles, connections
│   │   ├── FloatingPanel.tsx       ░░ Draggable/resizable physics panel with titlebar
│   │   ├── PanelColorPicker.tsx    ░░ Inline color picker for individual panel colors
│   │   ├── Toolbar.tsx             ░░ Draggable/lockable toolbar with tool launchers
│   │   ├── ToolPanel.tsx           ░░ Tool content container & component registry
│   │   ├── SettingsPanel.tsx       ░░ Accordion-style settings (physics, shadows, sound, visual)
│   │   ├── NoiseOverlay.tsx        ░░ WebGL grain/noise shader overlay
│   │   ├── EffectsOverlay.tsx      ░░ Click-through overlay (scanlines, CRT, VHS, chromatic)
│   │   ├── NoteContent.tsx         ░░ Note panel content type
│   │   ├── TodoContent.tsx         ░░ Todo list panel content type
│   │   └── ImageContent.tsx        ░░ Image panel content type
│   └── ui/                         ░░ shadcn/ui components
├── constants/
│   └── grid.ts                     ░░ Layout constants, movement presets, default config
├── hooks/
│   └── usePanelPersistence.ts      ░░ localStorage persistence for panels, connections, config
├── types/
│   └── grid.ts                     ░░ TypeScript interfaces (PhysicsConfig, FloatingPanelData, etc.)
├── utils/
│   ├── SoundEffects.ts             ░░ UI sound effects (hover, click, connection)
│   └── PanelSoundEffects.ts        ░░ Panel collision/bounce audio via Web Audio API
├── styles/
│   └── grid.css                    ░░ Global grid playground styles
└── pages/
    └── Index.tsx                   ░░ Route entry point
```

## ░░ Features ░░

- **Node Editor Canvas** — Double-click to spawn panels, drag to move, physics-based throwing
- **Panel Connections** — Drag from corner handle to wire panels; slice to cut connections
- **Movement Modes** — Sticky (no throw), Default (standard), Bouncy (high reactivity)
- **Panel Color Picker** — Per-panel color via palette icon in titlebar
- **Draggable Toolbar** — Lockable toolbar with 4 tool launchers (Image Editor, Text Editor, Draw Tool, Color Picker)
- **Modular Tool Panels** — Each tool is a standalone component; see `ToolPanel.tsx` for the registry
- **Settings Menu** — Accordion UI controlling physics, shadows, sound, and visual config
- **Visual Overlays** — Scanlines, CRT, VHS, Chromatic Aberration (click-through)
- **Noise Shader** — WebGL grain overlay
- **Full Persistence** — All state saved to localStorage (panels, connections, config, toolbar)
- **Keyboard Shortcuts** — Shift (snap), ⌘+Drag (scale from center), ⌥+Drag (lock aspect), ESC (clear all)

## ░░ Adding New Tools — Step by Step ░░

Follow these 4 steps to install a new tool onto the toolbar:

### Step 1: Create the Tool Component

Create a new file at `src/components/tools/MyTool.tsx`. Your component receives `{ width, height }` props and must fill its container:

```tsx
// src/components/tools/MyTool.tsx
import React from 'react';
import type { ToolComponentProps } from '@/components/grid/ToolPanel';

export default function MyTool({ width, height }: ToolComponentProps) {
  return (
    <div style={{ width: '100%', height: '100%', padding: 16, color: 'var(--gp-text)' }}>
      {/* Your tool UI here */}
      <p>My Custom Tool ({width}×{height})</p>
    </div>
  );
}
```

**Important:** Use `var(--gp-*)` CSS variables for all colors, borders, and fonts so the tool respects theme switching.

### Step 2: Register in the Tool Component Map

Open `src/components/grid/ToolPanel.tsx`:

1. Import your component at the top:
   ```tsx
   import MyTool from '@/components/tools/MyTool';
   ```

2. Add it to the `TOOL_COMPONENTS` map:
   ```tsx
   const TOOL_COMPONENTS: Record<string, React.FC<ToolComponentProps>> = {
     'dither-ascii': DitherTool,
     'my-tool': MyTool,        // ← add this line
     // ...other tools
   };
   ```

### Step 3: Add a Toolbar Icon

Open `src/components/grid/Toolbar.tsx`:

1. Import an icon (from `lucide-react` or any SVG):
   ```tsx
   import { Wrench } from 'lucide-react';
   ```

2. Add your tool definition to the `TOOLS` array:
   ```tsx
   const TOOLS: ToolDefinition[] = [
     // ...existing tools
     { id: 'my-tool', label: 'My Tool', icon: <Wrench size={18} /> },
   ];
   ```

   Optional: set a custom default panel size:
   ```tsx
   { id: 'my-tool', label: 'My Tool', icon: <Wrench size={18} />, defaultSize: { width: 600, height: 400 } },
   ```

### Step 4: Add a Label in GridPlayground

Open `src/components/grid/GridPlayground.tsx`:

1. Add the panel title to `TOOL_LABELS`:
   ```tsx
   const TOOL_LABELS: Record<string, string> = {
     'my-tool': 'My Tool',
     // ...existing labels
   };
   ```

2. If you specified a `defaultSize` in step 3, also add it to `TOOL_SIZES`:
   ```tsx
   const TOOL_SIZES: Record<string, { width: number; height: number }> = {
     'my-tool': { width: 600, height: 400 },
     // ...existing sizes
   };
   ```

### That's it!

Your tool will now appear as a new icon in the toolbar. Clicking it opens a singleton panel — clicking again focuses the existing instance.

Each tool component is modular and can be used independently outside the grid playground.

## ░░ Tech Stack ░░

- React 18 + TypeScript + Vite
- Framer Motion (animations)
- Canvas2D (particles, grid)
- WebGL (noise shader)
- Web Audio API (sound effects)
- shadcn/ui + Tailwind CSS
- localStorage (persistence)
