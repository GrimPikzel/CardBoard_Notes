// ============================================================================
// ░░ TOOL PANEL - Modular Tool Content Container ░░
// Each tool renders inside this panel. Content is loaded from separate modules.
// ============================================================================

import React from 'react';
import DitherTool from '@/components/tools/DitherTool';

// ░░ Tool Component Props ░░
export interface ToolComponentProps {
  width: number;
  height: number;
}

// ░░ Placeholder implementations for future tools ░░
function ImageEditorPlaceholder({ width, height }: ToolComponentProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--gp-text-muted)' }}>
      <div style={{ width: Math.min(width * 0.6, 200), height: Math.min(height * 0.4, 120), border: '2px dashed var(--gp-border)', borderRadius: 'var(--gp-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>Drop image here</div>
      <span style={{ fontSize: 12 }}>Image Editor Tool</span>
      <span style={{ fontSize: 10, color: 'var(--gp-text-dim)' }}>Placeholder — replace in src/components/tools/</span>
    </div>
  );
}

function TextEditorPlaceholder({}: ToolComponentProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--gp-border)', paddingBottom: 8 }}>
        {['B', 'I', 'U', 'S'].map(b => (
          <button key={b} style={{ width: 28, height: 28, borderRadius: 'var(--gp-radius-sm)', border: '1px solid var(--gp-border)', background: 'var(--gp-surface)', color: 'var(--gp-text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: b === 'B' ? 700 : 400, fontStyle: b === 'I' ? 'italic' : 'normal', textDecoration: b === 'U' ? 'underline' : b === 'S' ? 'line-through' : 'none' }}>{b}</button>
        ))}
      </div>
      <div style={{ flex: 1, background: 'var(--gp-surface-deep)', borderRadius: 'var(--gp-radius-md)', padding: 10, color: 'var(--gp-text-dim)', fontSize: 13, border: '1px solid var(--gp-border)' }}>Text Editor Tool — placeholder</div>
    </div>
  );
}

function DrawToolPlaceholder({}: ToolComponentProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--gp-text-muted)' }}>
      <div style={{ width: '80%', height: '60%', border: '2px dashed var(--gp-border)', borderRadius: 'var(--gp-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>Canvas Area</div>
      <span style={{ fontSize: 12 }}>Draw Tool</span>
      <span style={{ fontSize: 10, color: 'var(--gp-text-dim)' }}>Placeholder — replace in src/components/tools/</span>
    </div>
  );
}

function ColorPickerPlaceholder({}: ToolComponentProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--gp-text-muted)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', opacity: 0.5 }} />
      <span style={{ fontSize: 12 }}>Color Picker Tool</span>
      <span style={{ fontSize: 10, color: 'var(--gp-text-dim)' }}>Placeholder — replace in src/components/tools/</span>
    </div>
  );
}

// ░░ Tool Component Map ░░
const TOOL_COMPONENTS: Record<string, React.FC<ToolComponentProps>> = {
  'dither-ascii': DitherTool,
  'image-editor': ImageEditorPlaceholder,
  'text-editor': TextEditorPlaceholder,
  'draw-tool': DrawToolPlaceholder,
  'color-picker': ColorPickerPlaceholder,
};

export function getToolComponent(toolId: string): React.FC<ToolComponentProps> | null {
  return TOOL_COMPONENTS[toolId] || null;
}

interface ToolPanelContentProps {
  toolId: string;
  width: number;
  height: number;
}

export default function ToolPanelContent({ toolId, width, height }: ToolPanelContentProps) {
  const ToolComponent = getToolComponent(toolId);
  if (!ToolComponent) {
    return <div style={{ padding: 16, color: 'var(--gp-text-muted)', fontSize: 13 }}>Unknown tool: {toolId}</div>;
  }
  return <ToolComponent width={width} height={height} />;
}
