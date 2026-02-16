import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Minus, PlusSquare, X, Pencil, CheckSquare, ImageIcon, Star } from 'lucide-react';
import type { PhysicsConfig, FloatingPanelData, ResizeEdge } from '@/types/grid';
import { PANEL_HEADER_HEIGHT, MIN_PANEL_SIZE, MAX_PANEL_SIZE, EDGE_THRESHOLD } from '@/constants/grid';
import { panelSounds } from '@/utils/PanelSoundEffects';
import NoteContent from './NoteContent';
import TodoContent from './TodoContent';
import ImageContentComponent from './ImageContent';
import PanelColorPicker from './PanelColorPicker';
import ToolPanelContent from './ToolPanel';

interface FloatingPanelProps {
  id: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  config: PhysicsConfig;
  isTopPanel?: boolean;
  isExiting?: boolean;
  title?: string;
  isMinimized?: boolean;
  type?: 'selector' | 'note' | 'todo' | 'image' | 'tool';
  content?: Record<string, unknown>;
  panelColor?: string;
  toolId?: string;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onBounce?: (x: number, y: number, intensity: number) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDismiss?: (id: string) => void;
  onConnectionDragStart?: (id: string, startX: number, startY: number) => void;
  onConnectionDragMove?: (x: number, y: number) => void;
  onConnectionDragEnd?: (id: string, targetId: string | null, x: number, y: number) => void;
  isConnectionTarget?: boolean;
  hasOutgoingConnection?: boolean;
  hasIncomingConnection?: boolean;
  onConnectionDelete?: (id: string) => void;
  onDataChange?: (id: string, data: Partial<FloatingPanelData>) => void;
}

export default function FloatingPanel({
  id,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  config,
  isTopPanel,
  isExiting,
  title: initialTitle = 'New Card',
  isMinimized: initialMinimized = false,
  content = {},
  type = 'selector',
  panelColor,
  toolId,
  onPositionChange,
  onSizeChange,
  onBounce,
  onDragStart,
  onDragEnd,
  onDismiss,
  onConnectionDragStart,
  onConnectionDragMove,
  onConnectionDragEnd,
  onDataChange,
}: FloatingPanelProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<ResizeEdge>(null);
  const [isResizing, setIsResizing] = useState(false);

  const lastShiftKeyRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerPanelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const velocitySamplesRef = useRef<Array<{ x: number; y: number; t: number }>>([]);
  const isAnimatingRef = useRef(false);
  const justBouncedRef = useRef({ x: false, y: false });
  const titleInputRef = useRef<HTMLInputElement>(null);

  const panelWidth = size.width;
  const panelHeight = isMinimized ? PANEL_HEADER_HEIGHT : size.height;

  // ░░ Shadow Styles ░░
  const DRAG_TRANSITION = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  const IDLE_SHADOW = `${config.idleShadowX}px ${config.idleShadowY}px ${config.idleShadowBlur}px ${config.idleShadowSpread}px rgba(0, 0, 0, ${config.idleShadowOpacity})`;
  const DRAG_SHADOW = `${config.dragShadowX}px ${config.dragShadowY}px ${config.dragShadowBlur}px ${config.dragShadowSpread}px rgba(0, 0, 0, ${config.dragShadowOpacity})`;

  const snapPanelToGrid = useCallback((x: number, y: number, w: number, h: number, grid = 40) => {
    const snappedX = Math.round((x + w / 2) / grid) * grid - w / 2;
    const snappedY = Math.round((y + h / 2) / grid) * grid - h / 2;
    return { x: snappedX, y: snappedY };
  }, []);

  // Init reporting & sounds
  useEffect(() => {
    onPositionChange?.(id, position.x, position.y);
    onSizeChange?.(id, size.width, size.height);
    panelSounds.initialize();
  }, []);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Physics helpers
  const getResizeEdge = useCallback((e: React.MouseEvent): ResizeEdge => {
    const panel = panelRef.current;
    if (!panel) return null;
    const rect = panel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nearLeft = x < EDGE_THRESHOLD;
    const nearRight = x > rect.width - EDGE_THRESHOLD;
    const nearTop = y < EDGE_THRESHOLD;
    const nearBottom = y > rect.height - EDGE_THRESHOLD;
    if (nearTop && nearLeft) return 'nw';
    if (nearTop && nearRight) return 'ne';
    if (nearBottom && nearLeft) return 'sw';
    if (nearBottom && nearRight) return 'se';
    if (nearTop) return 'n';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearRight) return 'e';
    return null;
  }, []);

  const getCursor = useCallback((edge: ResizeEdge | string) => {
    switch (edge) {
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      default: return 'default';
    }
  }, []);

  const getViewportBounds = useCallback((scale: number) => {
    const effectiveWidth = window.innerWidth / scale;
    const effectiveHeight = window.innerHeight / scale;
    return {
      minX: config.boundaryMargin,
      maxX: effectiveWidth - panelWidth - config.boundaryMargin,
      minY: config.boundaryMargin,
      maxY: effectiveHeight - panelHeight - config.boundaryMargin,
    };
  }, [config.boundaryMargin, panelWidth, panelHeight]);

  const clampVelocity = useCallback((vx: number, vy: number) => {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > config.maxVelocity) {
      const ratio = config.maxVelocity / speed;
      return { vx: vx * ratio, vy: vy * ratio };
    }
    return { vx, vy };
  }, [config.maxVelocity]);

  const calculateVelocityFromSamples = useCallback(() => {
    const samples = velocitySamplesRef.current;
    if (samples.length < 2) return { x: 0, y: 0 };
    const now = performance.now();
    const maxAge = 80;
    const lastSample = samples[samples.length - 1];
    if (now - lastSample.t > maxAge) return { x: 0, y: 0 };
    let totalWeight = 0, weightedVelX = 0, weightedVelY = 0;
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const dt = curr.t - prev.t;
      const age = now - curr.t;
      if (age <= maxAge && dt >= 8 && dt < 100) {
        const weight = i / samples.length;
        weightedVelX += ((curr.x - prev.x) / dt * 16.67) * weight;
        weightedVelY += ((curr.y - prev.y) / dt * 16.67) * weight;
        totalWeight += weight;
      }
    }
    if (totalWeight === 0) return { x: 0, y: 0 };
    return { x: weightedVelX / totalWeight, y: weightedVelY / totalWeight };
  }, []);

  const animateMomentum = useCallback((startX: number, startY: number, velX: number, velY: number, scale: number) => {
    const panel = panelRef.current;
    if (!panel) return;
    const clamped = clampVelocity(velX, velY);
    let x = startX, y = startY, vx = clamped.vx, vy = clamped.vy;
    isAnimatingRef.current = true;
    justBouncedRef.current = { x: false, y: false };

    const animate = () => {
      const bounds = getViewportBounds(scale);
      const speed = Math.sqrt(vx * vx + vy * vy);
      const speedRatio = Math.min(speed / config.maxVelocity, 1);
      const friction = config.baseFriction - (speedRatio * (config.baseFriction - config.highSpeedFriction));
      vx *= friction * (justBouncedRef.current.x ? config.bounceFrictionBoost : 1);
      vy *= friction * (justBouncedRef.current.y ? config.bounceFrictionBoost : 1);
      justBouncedRef.current = { x: false, y: false };
      x += vx;
      y += vy;
      let didBounce = false;
      const preSpeed = Math.sqrt(vx * vx + vy * vy);
      const impactForce = Math.min(preSpeed / config.maxVelocity, 1);

      if (x < bounds.minX) { x = bounds.minX; vx = Math.abs(vx) * config.bounceDamping; justBouncedRef.current.x = true; didBounce = true; onBounce?.(x, y + panelHeight / 2, impactForce); }
      else if (x > bounds.maxX) { x = bounds.maxX; vx = -Math.abs(vx) * config.bounceDamping; justBouncedRef.current.x = true; didBounce = true; onBounce?.(x + panelWidth, y + panelHeight / 2, impactForce); }
      if (y < bounds.minY) { y = bounds.minY; vy = Math.abs(vy) * config.bounceDamping; justBouncedRef.current.y = true; didBounce = true; onBounce?.(x + panelWidth / 2, y, impactForce); }
      else if (y > bounds.maxY) { y = bounds.maxY; vy = -Math.abs(vy) * config.bounceDamping; justBouncedRef.current.y = true; didBounce = true; onBounce?.(x + panelWidth / 2, y + panelHeight, impactForce); }

      if (didBounce && preSpeed > 0.5 && config.soundEnabled) {
        const norm = Math.min(preSpeed / config.maxVelocity, 1);
        panelSounds.play((config.soundMinVolume + (norm * norm) * (config.soundMaxVolume - config.soundMinVolume)) * config.soundVolume);
      }

      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      onPositionChange?.(id, x, y);
      if (Math.sqrt(vx * vx + vy * vy) > config.minVelocity) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
        setPosition({ x, y });
        onPositionChange?.(id, x, y);
      }
    };
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [config, clampVelocity, getViewportBounds, id, onBounce, onPositionChange, panelHeight, panelWidth]);

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent, edge: ResizeEdge) => {
    e.stopPropagation();
    if (!edge) return;
    const panel = panelRef.current;
    if (!panel) return;
    setIsResizing(true);
    onDragStart?.(id);
    const startMouseX = e.clientX, startMouseY = e.clientY;
    const startX = position.x, startY = position.y;
    const startWidth = size.width, startHeight = size.height;

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startMouseX;
      const deltaY = moveEvent.clientY - startMouseY;
      let newX = startX, newY = startY, newWidth = startWidth, newHeight = startHeight;
      if (edge.includes('e')) newWidth = Math.max(MIN_PANEL_SIZE, startWidth + deltaX);
      if (edge.includes('w')) { const wd = Math.min(deltaX, startWidth - MIN_PANEL_SIZE); newWidth = startWidth - wd; newX = startX + wd; }
      if (edge.includes('s')) newHeight = Math.max(MIN_PANEL_SIZE, startHeight + deltaY);
      if (edge.includes('n')) { const hd = Math.min(deltaY, startHeight - MIN_PANEL_SIZE); newHeight = startHeight - hd; newY = startY + hd; }
      newWidth = Math.max(MIN_PANEL_SIZE, Math.min(MAX_PANEL_SIZE, newWidth));
      newHeight = Math.max(MIN_PANEL_SIZE, Math.min(MAX_PANEL_SIZE, newHeight));
      const bounds = getViewportBounds(1);
      newX = Math.max(bounds.minX, newX);
      newY = Math.max(bounds.minY, newY);

      if (moveEvent.shiftKey) {
        const snappedW = Math.round(newWidth / 40) * 40;
        const snappedH = Math.round(newHeight / 40) * 40;
        if (edge.includes('w')) { newX += newWidth - snappedW; newWidth = snappedW; }
        else if (edge.includes('e')) newWidth = snappedW;
        if (edge.includes('n')) { newY += newHeight - snappedH; newHeight = snappedH; }
        else if (edge.includes('s')) newHeight = snappedH;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.width = `${newWidth}px`;
      panel.style.height = `${newHeight}px`;
      onPositionChange?.(id, newX, newY);
      onSizeChange?.(id, newWidth, newHeight);
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      setIsResizing(false);
      setResizeEdge(null);
      onDragEnd?.();
    };
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-connection-handle]')) return;
    const edge = getResizeEdge(e);
    if (edge && !isMinimized) { handleResizeStart(e, edge); return; }
    if (target.closest('[data-no-drag]')) return;
    e.stopPropagation();
    const panel = panelRef.current;
    if (!panel) return;

    const wasAnimating = animationFrameRef.current !== null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      isAnimatingRef.current = false;
    }

    const innerPanel = innerPanelRef.current;
    const rect = panel.getBoundingClientRect();
    const scale = rect.width / panelWidth;
    let startCssX = wasAnimating ? parseFloat(panel.style.left) : position.x;
    let startCssY = wasAnimating ? parseFloat(panel.style.top) : position.y;
    if (wasAnimating) setPosition({ x: startCssX, y: startCssY });

    const grabOffsetX = e.clientX - rect.left;
    const grabOffsetY = e.clientY - rect.top;
    const startRectLeft = rect.left;
    const startRectTop = rect.top;
    let hasMoved = false;
    let finalX = startCssX;
    let finalY = startCssY;
    velocitySamplesRef.current = [{ x: startCssX, y: startCssY, t: performance.now() }];

    const applyDragStyle = () => {
      if (innerPanel) {
        innerPanel.style.transition = DRAG_TRANSITION;
        innerPanel.style.transform = `scale(${config.dragPanelScale})`;
        innerPanel.style.boxShadow = DRAG_SHADOW;
      }
      panel.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
    };
    const removeDragStyle = () => {
      if (innerPanel) {
        innerPanel.style.transition = DRAG_TRANSITION;
        innerPanel.style.transform = `scale(${config.idlePanelScale})`;
        innerPanel.style.boxShadow = IDLE_SHADOW;
      }
      panel.style.cursor = '';
      document.body.style.cursor = '';
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const targetViewportX = moveEvent.clientX - grabOffsetX;
      const targetViewportY = moveEvent.clientY - grabOffsetY;
      const cssDeltaX = (targetViewportX - startRectLeft) / scale;
      const cssDeltaY = (targetViewportY - startRectTop) / scale;
      if (!hasMoved && (Math.abs(cssDeltaX) > 2 || Math.abs(cssDeltaY) > 2)) {
        hasMoved = true;
        setIsDragging(true);
        applyDragStyle();
        onDragStart?.(id);
      }
      if (hasMoved) {
        const bounds = getViewportBounds(scale);
        finalX = Math.max(bounds.minX, Math.min(bounds.maxX, startCssX + cssDeltaX));
        finalY = Math.max(bounds.minY, Math.min(bounds.maxY, startCssY + cssDeltaY));
        lastShiftKeyRef.current = moveEvent.shiftKey;
        if (lastShiftKeyRef.current) {
          const snapped = snapPanelToGrid(finalX, finalY, panelWidth, panelHeight, 40);
          finalX = Math.max(bounds.minX, Math.min(bounds.maxX, snapped.x));
          finalY = Math.max(bounds.minY, Math.min(bounds.maxY, snapped.y));
        }
        panel.style.left = `${finalX}px`;
        panel.style.top = `${finalY}px`;
        onPositionChange?.(id, finalX, finalY);
        velocitySamplesRef.current.push({ x: finalX, y: finalY, t: performance.now() });
        if (velocitySamplesRef.current.length > config.velocitySampleCount) velocitySamplesRef.current.shift();
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeDragStyle();
      setIsDragging(false);
      if (hasMoved) {
        onDragEnd?.();
        if (lastShiftKeyRef.current) {
          const snapped = snapPanelToGrid(finalX, finalY, panelWidth, panelHeight, 40);
          setPosition({ x: snapped.x, y: snapped.y });
          onPositionChange?.(id, snapped.x, snapped.y);
          lastShiftKeyRef.current = false;
          return;
        }
        const velocity = calculateVelocityFromSamples();
        const clamped = clampVelocity(velocity.x, velocity.y);
        const speed = Math.sqrt(clamped.vx * clamped.vx + clamped.vy * clamped.vy);
        if (speed > config.momentumThreshold) {
          animateMomentum(finalX, finalY, clamped.vx, clamped.vy, scale);
        } else {
          setPosition({ x: finalX, y: finalY });
        }
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
    onDataChange?.(id, { isMinimized: !isMinimized });
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onDataChange?.(id, { title });
  };

  const handleConnectionMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = innerPanelRef.current?.getBoundingClientRect();
    if (rect && onConnectionDragStart) {
      onConnectionDragStart(id, rect.right - 10, rect.bottom - 10);
      const handleConnectionMove = (moveEvent: MouseEvent) => { onConnectionDragMove?.(moveEvent.clientX, moveEvent.clientY); };
      const handleConnectionEnd = (endEvent: MouseEvent) => {
        document.removeEventListener('mousemove', handleConnectionMove);
        document.removeEventListener('mouseup', handleConnectionEnd);
        const targetPanel = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest('[data-panel-id]');
        const targetId = targetPanel?.getAttribute('data-panel-id');
        onConnectionDragEnd?.(id, targetId || null, endEvent.clientX, endEvent.clientY);
      };
      document.addEventListener('mousemove', handleConnectionMove);
      document.addEventListener('mouseup', handleConnectionEnd);
    }
  };

  const handleTypeSelect = (newType: 'note' | 'todo' | 'image') => {
    onDataChange?.(id, { type: newType, title: newType.charAt(0).toUpperCase() + newType.slice(1) });
  };

  const borderOpacity = isHovered || isResizing ? 0.3 : 0.1;

  return (
    <motion.div
      ref={panelRef}
      data-panel-id={id}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => { if (!isDragging && !isResizing && !isMinimized) setResizeEdge(getResizeEdge(e)); }}
      onMouseLeave={() => { if (!isResizing) { setResizeEdge(null); setIsHovered(false); } }}
      onMouseEnter={() => setIsHovered(true)}
      onDoubleClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isExiting ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
      transition={{ opacity: { duration: 0.15 }, scale: { type: 'spring', stiffness: 500, damping: 25 } }}
      style={{
        position: 'fixed',
        userSelect: 'none',
        left: position.x,
        top: position.y,
        width: panelWidth,
        height: panelHeight,
        zIndex: (isDragging || isResizing) ? 2147483647 : isTopPanel ? 2147483646 : 2147483645,
        cursor: isResizing ? getCursor(resizeEdge!) : (resizeEdge && !isMinimized ? getCursor(resizeEdge) : 'default'),
        willChange: 'transform, width, height',
      }}
    >
      <div
        ref={innerPanelRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--gp-radius-lg, 12px)',
          position: 'relative',
          backgroundColor: panelColor
            ? (config.panelBlur > 0 ? panelColor + Math.round(Math.max(0.5, 1 - config.panelBlur / 20) * 255).toString(16).padStart(2, '0') : panelColor)
            : (config.panelBlur > 0 ? `rgba(30, 30, 30, ${Math.max(0.5, 1 - config.panelBlur / 20)})` : 'var(--gp-panel-bg, #1e1e1e)'),
          backdropFilter: config.panelBlur > 0 ? `blur(${config.panelBlur}px)` : 'none',
          WebkitBackdropFilter: config.panelBlur > 0 ? `blur(${config.panelBlur}px)` : 'none',
          boxShadow: isDragging ? DRAG_SHADOW : IDLE_SHADOW,
          border: `1px solid var(--gp-border-panel, rgba(255, 255, 255, ${borderOpacity}))`,
          transition: 'height 0.3s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s, border-color 0.2s, background-color 0.3s',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div
          className="panel-header"
          style={{
            height: PANEL_HEADER_HEIGHT,
            minHeight: PANEL_HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            borderBottom: isMinimized ? 'none' : '1px solid var(--gp-header-border, rgba(255,255,255,0.05))',
            backgroundColor: panelColor ? `${panelColor}10` : 'var(--gp-header-bg, rgba(255,255,255,0.02))',
            cursor: 'grab',
          }}
          onDoubleClick={() => type !== 'tool' && setIsEditingTitle(true)}
        >
          <div style={{ flex: 1, marginRight: 8, overflow: 'hidden' }}>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                data-no-drag
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #333',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                  padding: '2px 6px',
                  outline: 'none',
                }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gp-header-text, #e5e5e5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                {title}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {/* ░░ Panel Color Picker ░░ */}
            <PanelColorPicker
              currentColor={panelColor || '#1e1e1e'}
              onColorChange={(color) => onDataChange?.(id, { panelColor: color })}
            />
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleToggleMinimize}
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gp-text-dim, #737373)', borderRadius: 'var(--gp-radius-sm, 4px)' }}
            >
              {isMinimized ? <PlusSquare size={14} /> : <Minus size={14} />}
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onDismiss ? () => onDismiss(id) : undefined}
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gp-text-dim, #737373)', borderRadius: 'var(--gp-radius-sm, 4px)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* CONTENT BODY — hidden via CSS when minimized to preserve state */}
        <div data-no-drag style={{ flex: 1, overflow: 'hidden', padding: 0, position: 'relative', cursor: 'default', display: isMinimized ? 'none' : 'flex', flexDirection: 'column' }}>
            {type === 'selector' ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['note', 'todo'] as const).map((t) => (
                    <button
                      key={t}
                      data-no-drag
                      onClick={() => handleTypeSelect(t)}
                      title={t === 'note' ? 'Notes' : 'Todo List'}
                      style={{
                        width: 50, height: 50, borderRadius: 'var(--gp-radius-md, 10px)',
                        border: '1px solid var(--gp-selector-border, #333)', background: 'var(--gp-selector-bg, #262626)', color: 'var(--gp-selector-text, #a3a3a3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gp-selector-border-hover)'; e.currentTarget.style.color = 'var(--gp-selector-text-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gp-selector-border)'; e.currentTarget.style.color = 'var(--gp-selector-text)'; }}
                    >
                      {t === 'note' ? <Pencil size={20} /> : <CheckSquare size={20} />}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    data-no-drag
                    onClick={() => handleTypeSelect('image')}
                    title="Image"
                    style={{
                      width: 50, height: 50, borderRadius: 'var(--gp-radius-md, 10px)',
                      border: '1px solid var(--gp-selector-border, #333)', background: 'var(--gp-selector-bg, #262626)', color: 'var(--gp-selector-text, #a3a3a3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gp-selector-border-hover)'; e.currentTarget.style.color = 'var(--gp-selector-text-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gp-selector-border)'; e.currentTarget.style.color = 'var(--gp-selector-text)'; }}
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    data-no-drag
                    disabled
                    style={{
                      width: 50, height: 50, borderRadius: 'var(--gp-radius-md, 10px)',
                      border: '1px solid var(--gp-selector-border, #333)', background: 'var(--gp-selector-bg, #262626)', color: 'var(--gp-text-dim, #525252)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'not-allowed',
                    }}
                  >
                    <Star size={20} />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gp-text-dim)', marginTop: 4 }}>Select Type</div>
              </div>
            ) : type === 'tool' && toolId ? (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ToolPanelContent toolId={toolId} width={size.width} height={size.height - PANEL_HEADER_HEIGHT} />
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {type === 'note' && <NoteContent content={content} onUpdate={(c) => onDataChange?.(id, { content: c })} />}
                {type === 'todo' && <TodoContent content={content} onUpdate={(c) => onDataChange?.(id, { content: c })} />}
                {type === 'image' && <ImageContentComponent content={content} onUpdate={(c) => onDataChange?.(id, { content: c })} />}
              </div>
            )}
          </div>

        {/* CONNECTION HANDLE */}
        {!isMinimized && isHovered && (
          <div
            data-connection-handle
            onMouseDown={handleConnectionMouseDown}
            style={{
              position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
              cursor: 'crosshair', opacity: 1, transition: 'opacity 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            }}
          >
            <div style={{ width: 8, height: 8, border: '1px solid #666', borderRadius: 2 }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
