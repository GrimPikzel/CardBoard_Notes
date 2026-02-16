// ============================================================================
// ░░ GRID PLAYGROUND - TYPE DEFINITIONS ░░
// ============================================================================

// ░░ Movement Modes ░░
export type MovementMode = 'sticky' | 'default' | 'bouncy';

// ░░ Overlay Effect Types ░░
export type OverlayType = 'none' | 'scanlines' | 'crt' | 'vhs' | 'chromatic';

// ░░ Background Types ░░
export type BackgroundType = 'grid' | 'dotpattern';

// ░░ Dot Pattern Shape Types ░░
export type DotShape = 'circle' | 'square' | 'text';

// ░░ Physics & Visual Configuration ░░
export interface PhysicsConfig {
  // ░░ Movement Physics ░░
  boundaryMargin: number;
  maxVelocity: number;
  baseFriction: number;
  highSpeedFriction: number;
  bounceDamping: number;
  bounceFrictionBoost: number;
  minVelocity: number;
  momentumThreshold: number;
  velocitySampleCount: number;
  movementMode: MovementMode;

  // ░░ Physics Toggles ░░
  particlesEnabled: boolean;
  rippleEnabled: boolean;
  gridEnabled: boolean;
  gridScale: number;

  // ░░ Panel Dimensions ░░
  panelWidth: number;

  // ░░ Shadow - Idle State ░░
  idleShadowX: number;
  idleShadowY: number;
  idleShadowBlur: number;
  idleShadowSpread: number;
  idleShadowOpacity: number;
  idlePanelScale: number;

  // ░░ Shadow - Drag State ░░
  dragShadowX: number;
  dragShadowY: number;
  dragShadowBlur: number;
  dragShadowSpread: number;
  dragShadowOpacity: number;
  dragPanelScale: number;

  // ░░ Sound ░░
  soundEnabled: boolean;
  soundVolume: number;
  soundMinVolume: number;
  soundMaxVolume: number;

  // ░░ Visual - Colors ░░
  backgroundColor: string;
  gridLineColor: string;
  gridLineOpacity: number;
  dotColor: string;
  dotOpacity: number;
  particleColor: string;
  particleOpacity: number;
  connectionColor: string;
  sliceTrailColor: string;

  // ░░ Visual - Panel ░░
  panelBlur: number;

  // ░░ Visual - Overlay ░░
  overlayType: OverlayType;
  overlayOpacity: number;

  // ░░ Visual - Theme ░░
  theme: string;

  // ░░ Background Type ░░
  backgroundType: BackgroundType;

  // ░░ Dot Pattern Settings ░░
  dotPatternSize: number;
  dotPatternSpacing: number;
  dotPatternColor: string;
  dotPatternGlow: boolean;
  dotPatternShape: DotShape;
  dotPatternText: string;
}

// ░░ Panel Data ░░
export interface FloatingPanelData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  isMinimized?: boolean;
  type?: 'selector' | 'note' | 'todo' | 'image' | 'tool';
  content?: Record<string, unknown>;
  isExiting?: boolean;
  panelColor?: string;
}

// ░░ Connection Types ░░
export interface PanelConnection {
  id: string;
  fromPanelId: string;
  toPanelId: string;
}

export interface ConnectionDrag {
  fromPanelId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetPanelId: string | null;
}

// ░░ Slice & Cut Types ░░
export interface SlicePoint {
  x: number;
  y: number;
  time: number;
}

export interface CutConnection {
  id: string;
  fromPanelId: string;
  toPanelId: string;
  cutX: number;
  cutY: number;
  cutTime: number;
}

// ░░ Pulse Events ░░
export interface PulseEvent {
  x: number;
  y: number;
  time: number;
  intensity: number;
}

// ░░ Particle Types ░░
export type ParticleShape = 'circle' | 'triangle' | 'square';
export type ParticleColor = 'cyan' | 'blue';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  shape: ParticleShape;
  color?: ParticleColor;
}

// ░░ Resize Types ░░
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
