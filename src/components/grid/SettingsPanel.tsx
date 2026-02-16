// ============================================================================
// ░░ SETTINGS PANEL ░░
// Accordion-style settings with Physics, Shadows, Sound, and Visual sections
// Uses CSS custom properties for theming
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X, Download, Upload } from 'lucide-react';
import type { PhysicsConfig, MovementMode, OverlayType, BackgroundType, DotShape } from '@/types/grid';
import { MOVEMENT_PRESETS, AVAILABLE_THEMES, OVERLAY_OPTIONS } from '@/constants/grid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface SettingsPanelProps {
  config: PhysicsConfig;
  onConfigChange: (config: PhysicsConfig) => void;
  onReset: () => void;
  onClose: () => void;
  onSaveToFile?: () => void;
  onLoadFromFile?: () => void;
}

// ░░ Reusable Sub-Components (themed) ░░
const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 12, color: 'var(--gp-text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
    {children}
  </div>
);

const SliderRow: React.FC<{
  label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: 'var(--gp-text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--gp-text-dim)', fontFamily: 'var(--gp-font-mono)', fontSize: 11 }}>
        {Number.isInteger(value) ? value : value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
      </span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
  </div>
);

const ColorInput: React.FC<{
  label: string; color: string; opacity?: number;
  onColorChange: (color: string) => void; onOpacityChange?: (opacity: number) => void;
}> = ({ label, color, opacity, onColorChange, onOpacityChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>{label}</span>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)}
        style={{ width: 28, height: 28, border: '1px solid var(--gp-border-hover)', borderRadius: 'var(--gp-radius-md)', cursor: 'pointer', background: 'transparent', padding: 0, flexShrink: 0 }}
      />
      <input type="text" value={color} onChange={(e) => onColorChange(e.target.value)}
        style={{ flex: 1, background: 'var(--gp-input-bg)', border: '1px solid var(--gp-input-border)', borderRadius: 'var(--gp-radius-md)', color: 'var(--gp-input-text)', fontSize: 12, fontFamily: 'var(--gp-font-mono)', padding: '4px 8px', outline: 'none', minWidth: 0 }}
      />
      {onOpacityChange !== undefined && opacity !== undefined && (
        <div style={{ width: 70, flexShrink: 0 }}>
          <Slider value={[opacity]} onValueChange={([v]) => onOpacityChange(v)} min={0} max={1} step={0.05} />
        </div>
      )}
    </div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={className} style={{ fontSize: 10, fontWeight: 600, color: 'var(--gp-text-dim)', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</span>
);

// ░░ Main Settings Panel ░░
const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onConfigChange, onReset, onClose, onSaveToFile, onLoadFromFile }) => {
  const update = (key: keyof PhysicsConfig, value: unknown) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleMovementMode = (mode: MovementMode) => {
    const preset = MOVEMENT_PRESETS[mode];
    onConfigChange({ ...config, ...preset });
  };

  const modeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px 0', fontSize: 12, fontWeight: isActive ? 600 : 400,
    color: isActive ? 'var(--gp-btn-text-active)' : 'var(--gp-text-dim)',
    background: isActive ? 'var(--gp-accent-muted)' : 'var(--gp-surface)',
    border: isActive ? '1px solid var(--gp-accent-border)' : '1px solid var(--gp-border)',
    borderRadius: 'var(--gp-radius-md)', cursor: 'pointer', transition: 'all 0.2s',
  });

  const headerBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
    color: 'var(--gp-text-dim)', background: 'var(--gp-surface)',
    border: '1px solid var(--gp-border)', borderRadius: 'var(--gp-radius-md)',
    padding: '4px 6px', cursor: 'pointer',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', top: 70, right: 20, width: 320, maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto', background: 'var(--gp-settings-bg)', border: '1px solid var(--gp-settings-border)',
        borderRadius: 'var(--gp-radius-lg)', padding: 16, zIndex: 2147483647, backdropFilter: 'blur(20px)',
      }}
      className="scrollbar-none"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gp-text)' }}>Settings</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {onSaveToFile && <button onClick={onSaveToFile} style={headerBtnStyle}><Download size={12} /></button>}
          {onLoadFromFile && <button onClick={onLoadFromFile} style={headerBtnStyle}><Upload size={12} /></button>}
          <button onClick={onReset} style={{ ...headerBtnStyle, padding: '4px 8px' }}><RotateCcw size={12} /> Reset</button>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, color: 'var(--gp-text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['physics', 'sound']} className="space-y-0">
        {/* PHYSICS */}
        <AccordionItem value="physics" className="border-b border-white/10">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:no-underline py-3">Physics</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Movement Mode</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['sticky', 'default', 'bouncy'] as MovementMode[]).map((mode) => (
                    <button key={mode} onClick={() => handleMovementMode(mode)} style={modeButtonStyle(config.movementMode === mode)}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <SettingRow label="Particles"><Switch checked={config.particlesEnabled} onCheckedChange={(v) => update('particlesEnabled', v)} /></SettingRow>
              <SettingRow label="Ripple Effect"><Switch checked={config.rippleEnabled} onCheckedChange={(v) => update('rippleEnabled', v)} /></SettingRow>
              <SettingRow label="Grid & Dots"><Switch checked={config.gridEnabled} onCheckedChange={(v) => update('gridEnabled', v)} /></SettingRow>
              {config.gridEnabled && <SliderRow label="Grid Scale" value={config.gridScale || 40} min={20} max={120} step={10} onChange={(v) => update('gridScale', v)} />}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SHADOWS */}
        <AccordionItem value="shadows" className="border-b border-white/10">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:no-underline py-3">Shadows</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SectionLabel>Idle</SectionLabel>
              <SliderRow label="Shadow Y" value={config.idleShadowY} min={-50} max={50} step={1} onChange={(v) => update('idleShadowY', v)} />
              <SliderRow label="Shadow X" value={config.idleShadowX} min={-50} max={50} step={1} onChange={(v) => update('idleShadowX', v)} />
              <SliderRow label="Shadow Blur" value={config.idleShadowBlur} min={0} max={60} step={1} onChange={(v) => update('idleShadowBlur', v)} />
              <SliderRow label="Opacity" value={config.idleShadowOpacity} min={0} max={1} step={0.05} onChange={(v) => update('idleShadowOpacity', v)} />
              <SliderRow label="Panel Scale" value={config.idlePanelScale} min={0.5} max={1.5} step={0.01} onChange={(v) => update('idlePanelScale', v)} />
              <SectionLabel className="mt-2">Drag</SectionLabel>
              <SliderRow label="Shadow Y" value={config.dragShadowY} min={-60} max={60} step={1} onChange={(v) => update('dragShadowY', v)} />
              <SliderRow label="Shadow X" value={config.dragShadowX} min={-60} max={60} step={1} onChange={(v) => update('dragShadowX', v)} />
              <SliderRow label="Shadow Blur" value={config.dragShadowBlur} min={0} max={80} step={1} onChange={(v) => update('dragShadowBlur', v)} />
              <SliderRow label="Opacity" value={config.dragShadowOpacity} min={0} max={1} step={0.05} onChange={(v) => update('dragShadowOpacity', v)} />
              <SliderRow label="Panel Scale" value={config.dragPanelScale} min={0.9} max={1.2} step={0.002} onChange={(v) => update('dragPanelScale', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SOUND */}
        <AccordionItem value="sound" className="border-b border-white/10">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:no-underline py-3">Sound</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SettingRow label="Enable Sound"><Switch checked={config.soundEnabled} onCheckedChange={(v) => update('soundEnabled', v)} /></SettingRow>
              <SliderRow label="Volume" value={config.soundVolume} min={0} max={1} step={0.05} onChange={(v) => update('soundVolume', v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* VISUAL */}
        <AccordionItem value="visual" className="border-b-0">
          <AccordionTrigger className="text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-300 hover:no-underline py-3">Visual</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionLabel>Colors</SectionLabel>
              <ColorInput label="Background" color={config.backgroundColor} onColorChange={(v) => update('backgroundColor', v)} />
              <ColorInput label="Grid Lines" color={config.gridLineColor} opacity={config.gridLineOpacity} onColorChange={(v) => update('gridLineColor', v)} onOpacityChange={(v) => update('gridLineOpacity', v)} />
              <ColorInput label="Dots" color={config.dotColor} opacity={config.dotOpacity} onColorChange={(v) => update('dotColor', v)} onOpacityChange={(v) => update('dotOpacity', v)} />
              <ColorInput label="Particles" color={config.particleColor} opacity={config.particleOpacity} onColorChange={(v) => update('particleColor', v)} onOpacityChange={(v) => update('particleOpacity', v)} />
              <ColorInput label="Connection Lines" color={config.connectionColor} onColorChange={(v) => update('connectionColor', v)} />
              <ColorInput label="Slicer Trail" color={config.sliceTrailColor} onColorChange={(v) => update('sliceTrailColor', v)} />
              <SliderRow label="Panel Blur / Transparency" value={config.panelBlur} min={0} max={20} step={1} onChange={(v) => update('panelBlur', v)} />

              {/* Overlay */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Overlay Effect</span>
                <select value={config.overlayType} onChange={(e) => update('overlayType', e.target.value as OverlayType)}
                  style={{ width: '100%', background: 'var(--gp-input-bg)', border: '1px solid var(--gp-input-border)', borderRadius: 'var(--gp-radius-md)', color: 'var(--gp-input-text)', fontSize: 12, padding: '6px 8px', outline: 'none', cursor: 'pointer' }}>
                  {OVERLAY_OPTIONS.map((opt) => <option key={opt.id} value={opt.id} style={{ background: 'var(--gp-bg)' }}>{opt.name}</option>)}
                </select>
              </div>
              {config.overlayType !== 'none' && <SliderRow label="Overlay Opacity" value={config.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => update('overlayOpacity', v)} />}

              {/* Theme */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Theme</span>
                <select value={config.theme} onChange={(e) => update('theme', e.target.value)}
                  style={{ width: '100%', background: 'var(--gp-input-bg)', border: '1px solid var(--gp-input-border)', borderRadius: 'var(--gp-radius-md)', color: 'var(--gp-input-text)', fontSize: 12, padding: '6px 8px', outline: 'none', cursor: 'pointer' }}>
                  {AVAILABLE_THEMES.map((t) => <option key={t.id} value={t.id} style={{ background: 'var(--gp-bg)' }}>{t.name}</option>)}
                </select>
              </div>

              {/* Background */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Background</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div onClick={() => update('backgroundType', 'grid')} style={{
                    width: 80, height: 40, borderRadius: 'var(--gp-radius-md)',
                    border: config.backgroundType === 'grid' ? '2px solid var(--gp-accent-border)' : '1px solid var(--gp-border-hover)',
                    background: 'linear-gradient(135deg, #171717, #1a1a2e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'var(--gp-text-dim)', cursor: 'pointer',
                  }}>Grid</div>
                  <div onClick={() => update('backgroundType', 'dotpattern')} style={{
                    width: 80, height: 40, borderRadius: 'var(--gp-radius-md)',
                    border: config.backgroundType === 'dotpattern' ? '2px solid var(--gp-accent-border)' : '1px solid var(--gp-border-hover)',
                    background: '#171717',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'var(--gp-text-dim)', cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <span style={{ letterSpacing: 4, fontSize: 8, opacity: 0.5 }}>···<br/>···</span>
                    <span style={{ position: 'absolute', bottom: 2, fontSize: 9 }}>Dots</span>
                  </div>
                </div>
              </div>

              {/* Dot Pattern Settings */}
              {config.backgroundType === 'dotpattern' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 8, borderLeft: '2px solid var(--gp-accent-muted)' }}>
                  <SliderRow label="Dot Size" value={config.dotPatternSize} min={0.5} max={5} step={0.25} onChange={(v) => update('dotPatternSize', v)} />
                  <SliderRow label="Spacing" value={config.dotPatternSpacing} min={10} max={60} step={2} onChange={(v) => update('dotPatternSpacing', v)} />
                  <ColorInput label="Dot Color" color={config.dotPatternColor} onColorChange={(v) => update('dotPatternColor', v)} />
                  <SettingRow label="Glow"><Switch checked={config.dotPatternGlow} onCheckedChange={(v) => update('dotPatternGlow', v)} /></SettingRow>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Shape</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {([{ id: 'circle', label: '●' }, { id: 'square', label: '■' }, { id: 'text', label: 'Aa' }] as { id: DotShape; label: string }[]).map((s) => (
                        <button key={s.id} onClick={() => update('dotPatternShape', s.id)} style={modeButtonStyle(config.dotPatternShape === s.id)}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  {config.dotPatternShape === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--gp-text-muted)' }}>Character / Unicode</span>
                      <input type="text" value={config.dotPatternText} onChange={(e) => update('dotPatternText', e.target.value)} maxLength={4}
                        style={{ background: 'var(--gp-input-bg)', border: '1px solid var(--gp-input-border)', borderRadius: 'var(--gp-radius-md)', color: 'var(--gp-input-text)', fontSize: 14, fontFamily: 'var(--gp-font-mono)', padding: '6px 8px', outline: 'none', width: '100%', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--gp-text-dim)' }}>Try: · • ✦ ★ ☰ ⬡ λ ░</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default SettingsPanel;
