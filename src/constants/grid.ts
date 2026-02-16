// ============================================================================
// ░░ GRID PLAYGROUND - CONSTANTS & PRESETS ░░
// ============================================================================

import type { PhysicsConfig, MovementMode, BackgroundType } from '@/types/grid';

// ░░ Layout Constants ░░
export const HEADER_HEIGHT = 48;
export const JOB_ROW_HEIGHT = 52;
export const PANEL_HEADER_HEIGHT = 40;
export const FLOATING_PANEL_SIZE = { width: 220, height: 220 };
export const GRID_CELL_SIZE = 40;
export const MIN_PANEL_SIZE = 220;
export const MAX_PANEL_SIZE = 1200;
export const EDGE_THRESHOLD = 20;

// ░░ Movement Presets ░░
export const MOVEMENT_PRESETS: Record<MovementMode, Partial<PhysicsConfig>> = {
  sticky: {
    maxVelocity: 0,
    baseFriction: 0.5,
    highSpeedFriction: 0.5,
    bounceDamping: 0,
    bounceFrictionBoost: 0,
    momentumThreshold: 9999,
    movementMode: 'sticky',
  },
  default: {
    maxVelocity: 40,
    baseFriction: 0.97,
    highSpeedFriction: 0.94,
    bounceDamping: 0.45,
    bounceFrictionBoost: 0.85,
    momentumThreshold: 1.5,
    movementMode: 'default',
  },
  bouncy: {
    maxVelocity: 60,
    baseFriction: 0.985,
    highSpeedFriction: 0.96,
    bounceDamping: 0.7,
    bounceFrictionBoost: 0.95,
    momentumThreshold: 0.5,
    movementMode: 'bouncy',
  },
};

// ░░ Default Configuration ░░
export const DEFAULT_CONFIG: PhysicsConfig = {
  // Movement Physics
  boundaryMargin: 8,
  maxVelocity: 40,
  baseFriction: 0.97,
  highSpeedFriction: 0.94,
  bounceDamping: 0.45,
  bounceFrictionBoost: 0.85,
  minVelocity: 0.15,
  momentumThreshold: 1.5,
  velocitySampleCount: 4,
  movementMode: 'default',

  // Physics Toggles
  particlesEnabled: true,
  rippleEnabled: true,
  gridEnabled: true,
  gridScale: 40,

  // Panel Dimensions
  panelWidth: 280,

  // Shadow - Idle
  idleShadowX: 0,
  idleShadowY: 24,
  idleShadowBlur: 24,
  idleShadowSpread: -12,
  idleShadowOpacity: 0.25,
  idlePanelScale: 1,

  // Shadow - Drag
  dragShadowX: 0,
  dragShadowY: 32,
  dragShadowBlur: 40,
  dragShadowSpread: -8,
  dragShadowOpacity: 0.55,
  dragPanelScale: 1.018,

  // Sound
  soundEnabled: true,
  soundVolume: 0.7,
  soundMinVolume: 0.015,
  soundMaxVolume: 0.15,

  // Visual - Colors
  backgroundColor: '#171717',
  gridLineColor: '#a0a0a0',
  gridLineOpacity: 1.0,
  dotColor: '#a0a0a0',
  dotOpacity: 1.0,
  particleColor: '#2563eb',
  particleOpacity: 1.0,
  connectionColor: '#3B82F6',
  sliceTrailColor: '#b4b4b4',

  // Visual - Panel
  panelBlur: 0,

  // Visual - Overlay
  overlayType: 'none',
  overlayOpacity: 0.5,

  // Visual - Theme
  theme: 'default',

  // Background Type
  backgroundType: 'grid' as BackgroundType,

  // Dot Pattern
  dotPatternSize: 1.0,
  dotPatternSpacing: 20,
  dotPatternColor: '#37352f',
  dotPatternGlow: false,
  dotPatternShape: 'circle' as const,
  dotPatternText: '·',
};

// ░░ Panel Gradients ░░
export const GRADIENTS = [
  'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)',
  'linear-gradient(135deg, #4a4a4a 0%, #333333 100%)',
  'linear-gradient(135deg, #383838 0%, #282828 100%)',
  'linear-gradient(135deg, #454545 0%, #303030 100%)',
  'linear-gradient(135deg, #404040 0%, #2d2d2d 100%)',
  'linear-gradient(135deg, #3d3d3d 0%, #2b2b2b 100%)',
  'linear-gradient(135deg, #484848 0%, #323232 100%)',
  'linear-gradient(135deg, #3b3b3b 0%, #292929 100%)',
  'linear-gradient(135deg, #434343 0%, #2e2e2e 100%)',
  'linear-gradient(135deg, #3f3f3f 0%, #2c2c2c 100%)',
];

// ░░ Theme Definitions ░░
export const AVAILABLE_THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'dos', name: 'DOS / Hacker' },
  { id: 'greyscale', name: 'Greyscale' },
  { id: 'neo-brutalism', name: 'Neo Brutalism' },
];

// ░░ Overlay Options ░░
export const OVERLAY_OPTIONS = [
  { id: 'none', name: 'None' },
  { id: 'scanlines', name: 'Scanlines' },
  { id: 'crt', name: 'CRT Monitor' },
  { id: 'vhs', name: 'VHS' },
  { id: 'chromatic', name: 'Chromatic Aberration' },
];

// ░░ Dummy Names ░░
export const DUMMY_NAMES = [
  'cosmic-nebula', 'azure-crystal', 'midnight-bloom', 'solar-flare',
  'ocean-depths', 'aurora-burst', 'velvet-storm', 'golden-hour',
  'neon-dreams', 'frost-peak',
];
