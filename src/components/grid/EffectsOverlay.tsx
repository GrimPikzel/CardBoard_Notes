// ============================================================================
// ░░ EFFECTS OVERLAY ░░
// Full-page click-through overlay for visual filters
// Supports: Scanlines, CRT, VHS, Chromatic Aberration
// Add new effects by extending the OverlayType and adding a case below
// ============================================================================

import React from 'react';
import type { OverlayType } from '@/types/grid';

interface EffectsOverlayProps {
  type: OverlayType;
  opacity: number;
}

export default function EffectsOverlay({ type, opacity }: EffectsOverlayProps) {
  if (type === 'none' || opacity <= 0) return null;

  // ░░ Base style - always click-through, covers full viewport ░░
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 2147483644,
    opacity,
  };

  // ░░ Effect-specific styles ░░
  const getEffectStyle = (): React.CSSProperties => {
    switch (type) {
      case 'scanlines':
        return {
          ...baseStyle,
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0, 0, 0, 0.3) 1px, rgba(0, 0, 0, 0.3) 2px)',
          backgroundSize: '100% 2px',
        };

      case 'crt':
        return {
          ...baseStyle,
          background: [
            'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0, 0, 0, 0.15) 1px, rgba(0, 0, 0, 0.15) 2px)',
            'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%)',
          ].join(', '),
        };

      case 'vhs':
        return {
          ...baseStyle,
          background: [
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)',
            'repeating-linear-gradient(90deg, rgba(255, 0, 0, 0.03) 0px, rgba(0, 255, 0, 0.03) 1px, rgba(0, 0, 255, 0.03) 2px)',
          ].join(', '),
          backgroundSize: '100% 4px, 3px 100%',
        };

      case 'chromatic':
        return {
          ...baseStyle,
          boxShadow: [
            'inset 3px 0 8px rgba(255, 0, 0, 0.15)',
            'inset -3px 0 8px rgba(0, 0, 255, 0.15)',
          ].join(', '),
        };

      default:
        return baseStyle;
    }
  };

  return <div style={getEffectStyle()} aria-hidden="true" />;
}
