// ============================================================================
// ░░ PANEL COLOR PICKER ░░
// Inline color picker for individual panel titlebar/body color
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

// ░░ Preset Colors ░░
const PRESET_COLORS = [
  '#1e1e1e', // Default dark
  '#2d1b1b', // Dark red
  '#1b2d1b', // Dark green
  '#1b1b2d', // Dark blue
  '#2d2b1b', // Dark yellow
  '#2d1b2b', // Dark purple
  '#1b2d2b', // Dark teal
  '#2d2d2d', // Light gray
  '#1e2a1e', // Forest
  '#2a1e2a', // Plum
  '#1e2a2a', // Ocean
  '#2a2a1e', // Olive
];

interface PanelColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
}

export default function PanelColorPicker({ currentColor = '#1e1e1e', onColorChange }: PanelColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(currentColor);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ░░ Close on outside click ░░
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  useEffect(() => { setHexInput(currentColor); }, [currentColor]);

  const handleHexSubmit = () => {
    const hex = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onColorChange(hex);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ░░ Color Picker Button ░░ */}
      <button
        ref={buttonRef}
        data-no-drag
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#737373', borderRadius: 4,
        }}
        title="Panel color"
      >
        <Palette size={14} />
      </button>

      {/* ░░ Color Picker Popover ░░ */}
      {isOpen && (
        <div
          ref={popoverRef}
          data-no-drag
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 28, right: 0,
            width: 180,
            padding: 10,
            background: 'rgba(25, 25, 25, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* ░░ Preset Color Grid ░░ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { onColorChange(color); setHexInput(color); }}
                style={{
                  width: 24, height: 24, borderRadius: 4,
                  background: color,
                  border: currentColor === color ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              />
            ))}
          </div>

          {/* ░░ Hex Input ░░ */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: 4,
                background: currentColor,
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                color: '#ccc',
                fontSize: 11,
                padding: '3px 6px',
                outline: 'none',
                fontFamily: 'monospace',
              }}
              placeholder="#1e1e1e"
            />
          </div>
        </div>
      )}
    </div>
  );
}
