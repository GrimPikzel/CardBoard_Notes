import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import '@/styles/grid.css';
import '@/styles/themes.css';

import type { FloatingPanelData, PanelConnection, ConnectionDrag, SlicePoint, CutConnection, PulseEvent } from '@/types/grid';
import { DEFAULT_CONFIG, FLOATING_PANEL_SIZE } from '@/constants/grid';
import { usePanelPersistence } from '@/hooks/usePanelPersistence';
import { soundEffects } from '@/utils/SoundEffects';
import { panelSounds } from '@/utils/PanelSoundEffects';

import NoiseOverlay from '@/components/grid/NoiseOverlay'; /* ░░ BLOCKED because it was being a bitch ░░ */
import EffectsOverlay from '@/components/grid/EffectsOverlay';
import DotGridCanvas from '@/components/grid/DotGridCanvas';
import FloatingPanel from '@/components/grid/FloatingPanel';
import SettingsPanel from '@/components/grid/SettingsPanel';
import Toolbar, { TOOLS } from '@/components/grid/Toolbar';
import DotPatternCanvas from '@/components/grid/DotPatternCanvas';


// ░░ Tool Panel Names ░░
const TOOL_LABELS: Record<string, string> = {
  'dither-ascii': 'Dither / ASCII',
  'image-editor': 'Image Editor',
  'text-editor': 'Text Editor',
  'draw-tool': 'Draw Tool',
  'color-picker': 'Color Picker',
};

// ░░ Tool default sizes ░░
const TOOL_SIZES: Record<string, { width: number; height: number }> = {
  'dither-ascii': { width: 700, height: 500 },
};
const DEFAULT_TOOL_SIZE = { width: 400, height: 350 };

type WallpaperMode = "cover" | "tile";

interface GridPlaygroundProps {
  wallpaper: string;
  wallpaperMode: WallpaperMode;
  setWallpaper: (value: string) => void;
  setWallpaperMode: (mode: WallpaperMode) => void;
}

export default function GridPlayground({
  wallpaper,
  wallpaperMode,
  setWallpaper,
  setWallpaperMode,
}: GridPlaygroundProps) {
	const hasWallpaper = wallpaper.trim().length > 0;
	const [showSettings, setShowSettings] = useState(false);
	const [panelPos] = useState({ x: -9999, y: -9999 });
	const [panelSize] = useState({ width: 0, height: 0 });
	const [pulses, setPulses] = useState<PulseEvent[]>([]);
	const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const { panels: floatingPanels, setPanels: setFloatingPanels, connections, setConnections, panelIdCounter: savedPanelIdCounter, setPanelIdCounter: setSavedPanelIdCounter, config, setConfig, isLoaded: persistenceLoaded, clearAllData, exportToFile, importFromFile } = usePanelPersistence();

const lastSpawnTimeRef = useRef(0);

  const [canvasResetKey, setCanvasResetKey] = useState(0);
  const panelIdCounter = useRef(savedPanelIdCounter);
  const hasSpawnedDefaultPanel = useRef(false);
  const isDraggingRef = useRef(false);
  const sliceDragRef = useRef<{ startX: number; startY: number; lastX: number; lastY: number; isSlicing: boolean } | null>(null);
  const viewportDimensions = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [topPanelId, setTopPanelId] = useState<string | null>(null);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDrag | null>(null);
  const [sliceTrail, setSliceTrail] = useState<SlicePoint[]>([]);
  const [cutConnections, setCutConnections] = useState<CutConnection[]>([]);
  const lastConnectionTargetRef = useRef<string | null>(null);
  const touchedGridDotsRef = useRef<Set<string>>(new Set());
  const lastDotSoundTimeRef = useRef(0);

  // ░░ Apply theme to document ░░
  useEffect(() => {
    const themeMap: Record<string, string> = { 'default': 'default', 'dos': 'dos' };
    const dataTheme = themeMap[config.theme] || 'default';
    document.documentElement.setAttribute('data-theme', dataTheme);
  }, [config.theme]);

  // ░░ Compute which tool IDs are currently open (for singleton indicator) ░░
  const openToolIds = useMemo(() => {
    return floatingPanels
      .filter(p => p.type === 'tool' && p.content?.toolId && !p.isExiting)
      .map(p => p.content!.toolId as string);
  }, [floatingPanels]);

  // Sync panel id counter
  useEffect(() => { if (panelIdCounter.current !== savedPanelIdCounter) setSavedPanelIdCounter(panelIdCounter.current); }, [savedPanelIdCounter, setSavedPanelIdCounter]);
  useEffect(() => { if (savedPanelIdCounter > panelIdCounter.current) panelIdCounter.current = savedPanelIdCounter; }, [savedPanelIdCounter]);

  // Disable CSS zoom
  useEffect(() => {
    document.documentElement.classList.add('no-zoom');
    return () => document.documentElement.classList.remove('no-zoom');
  }, []);

  // ░░ Listen for dither "add to canvas" events ░░
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      createImagePanel(e.detail as string);
    };
    window.addEventListener('dither-add-to-canvas', handler as EventListener);
    return () => window.removeEventListener('dither-add-to-canvas', handler as EventListener);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setFloatingPanels(prev => prev.map(p => ({ ...p, isExiting: true })));
    setConnections([]); setCutConnections([]); setConnectionDrag(null); setSliceTrail([]);
    setTimeout(() => { clearAllData(); panelIdCounter.current = 0; setCanvasResetKey(k => k + 1); }, 200);
  }, [clearAllData, setFloatingPanels, setConnections]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'u')) { e.preventDefault(); e.stopPropagation(); return; }
      // ESC shortcut removed to prevent accidental data loss
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [floatingPanels.length, clearAll]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const oldW = viewportDimensions.current.width, oldH = viewportDimensions.current.height;
      const newW = window.innerWidth, newH = window.innerHeight;
      if (oldW === 0 || oldH === 0) { viewportDimensions.current = { width: newW, height: newH }; return; }
      setFloatingPanels(prev => prev.map(p => ({ ...p, x: (p.x / oldW) * newW, y: (p.y / oldH) * newH })));
      viewportDimensions.current = { width: newW, height: newH };
    };
    viewportDimensions.current = { width: window.innerWidth, height: window.innerHeight };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setFloatingPanels]);

  const handleBounce = useCallback((x: number, y: number, intensity: number) => {
    setPulses(prev => { const now = performance.now(); return [...prev.filter(p => now - p.time < 2000), { x, y, time: now, intensity }]; });
  }, []);

  // Line segment intersection
  const lineSegmentsIntersect = useCallback((x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }, []);

  // Mouse move - hover glow & slice
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (sliceDragRef.current?.isSlicing) {
      const { lastX, lastY } = sliceDragRef.current;
      const currX = e.clientX, currY = e.clientY;
      const now = performance.now();
      setSliceTrail(prev => [...prev.filter(p => now - p.time < 300), { x: currX, y: currY, time: now }]);

      if (connections.length > 0) {
        const gridSize = 40;
        for (const conn of connections) {
          const fromPanel = floatingPanels.find(p => p.id === conn.fromPanelId);
          const toPanel = floatingPanels.find(p => p.id === conn.toPanelId);
          if (fromPanel && toPanel) {
            const snap = (v: number) => Math.round(v / gridSize) * gridSize;
            const fromEH = fromPanel.isMinimized ? 40 : fromPanel.height;
            const toEH = toPanel.isMinimized ? 40 : toPanel.height;
            const sgx = snap(fromPanel.x + fromPanel.width / 2), sgy = snap(fromPanel.y + fromEH / 2);
            const egx = snap(toPanel.x + toPanel.width / 2), egy = snap(toPanel.y + toEH / 2);
            const pathPoints: { x: number; y: number }[] = [];
            const xStep = sgx < egx ? gridSize : -gridSize;
            if (sgx !== egx) for (let gx = sgx; xStep > 0 ? gx <= egx : gx >= egx; gx += xStep) pathPoints.push({ x: gx, y: sgy });
            else pathPoints.push({ x: sgx, y: sgy });
            const yStep = sgy < egy ? gridSize : -gridSize;
            if (sgy !== egy) for (let gy = sgy + yStep; yStep > 0 ? gy <= egy : gy >= egy; gy += yStep) pathPoints.push({ x: egx, y: gy });

            let intersected = false;
            let cutPoint = { x: (lastX + currX) / 2, y: (lastY + currY) / 2 };
            for (let i = 0; i < pathPoints.length - 1; i++) {
              if (lineSegmentsIntersect(lastX, lastY, currX, currY, pathPoints[i].x, pathPoints[i].y, pathPoints[i + 1].x, pathPoints[i + 1].y)) {
                intersected = true; cutPoint = { x: (pathPoints[i].x + pathPoints[i + 1].x) / 2, y: (pathPoints[i].y + pathPoints[i + 1].y) / 2 }; break;
              }
            }
            if (intersected) {
              setCutConnections(prev => [...prev, { id: conn.id, fromPanelId: conn.fromPanelId, toPanelId: conn.toPanelId, cutX: cutPoint.x, cutY: cutPoint.y, cutTime: now }]);
              setConnections(prev => prev.filter(c => c.id !== conn.id));
              panelSounds.playRandomized(0.05, 0.7, 0.15);
              break;
            }
          }
        }
      }
      sliceDragRef.current.lastX = currX; sliceDragRef.current.lastY = currY;
    }
  }, [connections, floatingPanels, lineSegmentsIntersect, setConnections]);

  const handleMouseLeave = useCallback(() => { setMousePos(null); sliceDragRef.current = null; }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-panel-id]')) return;
    sliceDragRef.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, isSlicing: false };
  }, []);

  const handleMouseUp = useCallback(() => {
    if (sliceDragRef.current?.isSlicing) setTimeout(() => { isDraggingRef.current = false; }, 50);
    sliceDragRef.current = null;
  }, []);

  // Detect slice start
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (sliceDragRef.current && !sliceDragRef.current.isSlicing) {
        const dx = e.clientX - sliceDragRef.current.startX, dy = e.clientY - sliceDragRef.current.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 10) { sliceDragRef.current.isSlicing = true; isDraggingRef.current = true; }
      }
    };
    const onUp = () => { if (sliceDragRef.current?.isSlicing) setTimeout(() => { isDraggingRef.current = false; }, 50); sliceDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  
// Spawn on middle mouse click
const handleMiddleClick = useCallback((e: React.MouseEvent) => {
  // Check if middle mouse button (button === 1)
  if (e.button !== 1) return;
  if (isDraggingRef.current || sliceDragRef.current?.isSlicing) return;
  
  // Debounce to prevent double-spawn from onMouseDown + onAuxClick
  const now = performance.now();
  if (now - lastSpawnTimeRef.current < 650) return; // 50ms cooldown
  lastSpawnTimeRef.current = now;
  
  e.preventDefault(); // Prevent default middle-click behavior
  panelSounds.playRandomized(0.04, 0.9, 0.1);
  const x = e.clientX - FLOATING_PANEL_SIZE.width / 2, y = e.clientY - FLOATING_PANEL_SIZE.height / 2;
  const id = `floating-panel-${panelIdCounter.current++}`;
  setSavedPanelIdCounter(panelIdCounter.current);
  setFloatingPanels(prev => [...prev, { id, x, y, width: FLOATING_PANEL_SIZE.width, height: FLOATING_PANEL_SIZE.height }]);
}, [setFloatingPanels, setSavedPanelIdCounter]);

  // Spawn on double click

/*   const handleGridDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current || sliceDragRef.current?.isSlicing) return;
    panelSounds.playRandomized(0.04, 0.9, 0.1);
    const x = e.clientX - FLOATING_PANEL_SIZE.width / 2, y = e.clientY - FLOATING_PANEL_SIZE.height / 2;
    const id = `floating-panel-${panelIdCounter.current++}`;
    setSavedPanelIdCounter(panelIdCounter.current);
    setFloatingPanels(prev => [...prev, { id, x, y, width: FLOATING_PANEL_SIZE.width, height: FLOATING_PANEL_SIZE.height }]);
  }, [setFloatingPanels, setSavedPanelIdCounter]); */

  const handleFloatingPanelPositionChange = useCallback((id: string, x: number, y: number) => {
    setFloatingPanels(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, [setFloatingPanels]);

  const handleFloatingPanelSizeChange = useCallback((id: string, width: number, height: number) => {
    setFloatingPanels(prev => prev.map(p => p.id === id ? { ...p, width, height } : p));
  }, [setFloatingPanels]);

  const handleFloatingPanelDismiss = useCallback((id: string) => {
    setFloatingPanels(prev => prev.map(p => p.id === id ? { ...p, isExiting: true } : p));
    setConnections(prev => prev.filter(c => c.fromPanelId !== id && c.toPanelId !== id));
    setTimeout(() => { setFloatingPanels(prev => prev.filter(p => p.id !== id)); }, 200);
  }, [setFloatingPanels, setConnections]);

  // Connection handlers
  const handleConnectionDragStart = useCallback((fromPanelId: string, startX: number, startY: number) => {
    isDraggingRef.current = true;
    touchedGridDotsRef.current.clear();
    setConnectionDrag({ fromPanelId, fromX: startX, fromY: startY, toX: startX, toY: startY, targetPanelId: null });
  }, []);

  const handleConnectionDragMove = useCallback((x: number, y: number) => {
    setConnectionDrag(prev => {
      if (!prev) return null;
      const gridSize = 40;
      const currentlyTouched = new Set<string>();
      const lineLength = Math.sqrt((x - prev.fromX) ** 2 + (y - prev.fromY) ** 2);
      const steps = Math.max(1, Math.ceil(lineLength / 10));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = prev.fromX + (x - prev.fromX) * t, py = prev.fromY + (y - prev.fromY) * t;
        const dotX = Math.round(px / gridSize) * gridSize, dotY = Math.round(py / gridSize) * gridSize;
        if (Math.sqrt((px - dotX) ** 2 + (py - dotY) ** 2) < 15) currentlyTouched.add(`${dotX},${dotY}`);
      }
      const now = performance.now();
      currentlyTouched.forEach(dk => {
        if (!touchedGridDotsRef.current.has(dk) && now - lastDotSoundTimeRef.current > 25) {
          panelSounds.play(0.035, 1.0 + (Math.random() - 0.5) * 0.3);
          lastDotSoundTimeRef.current = now;
        }
      });
      touchedGridDotsRef.current = currentlyTouched;

      const elementsAtPoint = document.elementsFromPoint(x, y);
      let targetPanelId: string | null = null;
      for (const el of elementsAtPoint) {
        const panelEl = el.closest('[data-panel-id]');
        if (panelEl) {
          const pid = panelEl.getAttribute('data-panel-id');
          if (pid && pid !== prev.fromPanelId && !connections.find(c => (c.fromPanelId === prev.fromPanelId && c.toPanelId === pid) || (c.fromPanelId === pid && c.toPanelId === prev.fromPanelId))) {
            targetPanelId = pid; break;
          }
        }
      }
      if (targetPanelId && targetPanelId !== lastConnectionTargetRef.current) soundEffects.playHoverSound('connection-target');
      lastConnectionTargetRef.current = targetPanelId;
      return { ...prev, toX: x, toY: y, targetPanelId };
    });
  }, [connections]);

  const handleConnectionDragEnd = useCallback((fromPanelId: string, toPanelId: string | null, dropX: number, dropY: number) => {
    let targetId = toPanelId;
    if (toPanelId) {
      if (connections.find(c => (c.fromPanelId === fromPanelId && c.toPanelId === toPanelId) || (c.fromPanelId === toPanelId && c.toPanelId === fromPanelId))) targetId = null;
    } else {
      const newPanelId = `floating-panel-${panelIdCounter.current++}`;
      setSavedPanelIdCounter(panelIdCounter.current);
      setFloatingPanels(prev => [...prev, { id: newPanelId, x: dropX - FLOATING_PANEL_SIZE.width / 2, y: dropY - FLOATING_PANEL_SIZE.height / 2, width: FLOATING_PANEL_SIZE.width, height: FLOATING_PANEL_SIZE.height }]);
      targetId = newPanelId;
      panelSounds.playRandomized(0.04, 0.9, 0.1);
    }
    if (targetId) {
      setConnections(prev => [...prev, { id: `connection-${fromPanelId}-${targetId}`, fromPanelId, toPanelId: targetId! }]);
      soundEffects.playQuickStartClick(0.06);
    }
    setConnectionDrag(null);
    lastConnectionTargetRef.current = null;
    touchedGridDotsRef.current.clear();
    setTimeout(() => { isDraggingRef.current = false; }, 50);
  }, [connections, setFloatingPanels, setConnections, setSavedPanelIdCounter]);

  const handleCutAnimationComplete = useCallback((connectionId: string) => {
    setCutConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const handleDragStart = useCallback((panelId: string) => { isDraggingRef.current = true; setTopPanelId(panelId); }, []);
  const handleDragEnd = useCallback(() => { setTimeout(() => { isDraggingRef.current = false; }, 50); }, []);

  const handleDataChange = useCallback((id: string, data: Partial<FloatingPanelData>) => {
    setFloatingPanels(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, [setFloatingPanels]);

  // ░░ Tool Launch Handler (singleton: focus existing if open) ░░
  const handleToolLaunch = useCallback((toolId: string) => {
    // Check if this tool is already open
    const existingPanel = floatingPanels.find(
      p => p.type === 'tool' && p.content?.toolId === toolId && !p.isExiting
    );
    if (existingPanel) {
      // Focus existing panel (bring to top)
      setTopPanelId(existingPanel.id);
      return;
    }

    panelSounds.playRandomized(0.04, 0.9, 0.1);
    const toolSize = TOOL_SIZES[toolId] || DEFAULT_TOOL_SIZE;
    const x = window.innerWidth / 2 - toolSize.width / 2;
    const y = window.innerHeight / 2 - toolSize.height / 2;
    const id = `floating-panel-${panelIdCounter.current++}`;
    setSavedPanelIdCounter(panelIdCounter.current);
    setFloatingPanels(prev => [...prev, {
      id, x, y,
      width: toolSize.width, height: toolSize.height,
      type: 'tool' as const,
      title: TOOL_LABELS[toolId] || toolId,
      content: { toolId },
    }]);
  }, [floatingPanels, setFloatingPanels, setSavedPanelIdCounter]);

  // ░░ Image Panel from file data ░░
  const createImagePanel = useCallback((dataUrl: string, dropX?: number, dropY?: number) => {
    panelSounds.playRandomized(0.04, 0.9, 0.1);
    const x = (dropX ?? window.innerWidth / 2) - FLOATING_PANEL_SIZE.width / 2;
    const y = (dropY ?? window.innerHeight / 2) - FLOATING_PANEL_SIZE.height / 2;
    const id = `floating-panel-${panelIdCounter.current++}`;
    setSavedPanelIdCounter(panelIdCounter.current);
    setFloatingPanels(prev => [...prev, {
      id, x, y,
      width: 300, height: 280,
      type: 'image' as const,
      title: 'Image',
      content: { src: dataUrl },
    }]);
  }, [setFloatingPanels, setSavedPanelIdCounter]);

  // ░░ Drag & Drop Handler ░░
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => { createImagePanel(reader.result as string, e.clientX, e.clientY); };
        reader.readAsDataURL(file);
      }
    }
  }, [createImagePanel]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ░░ Paste from Clipboard ░░
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { createImagePanel(reader.result as string); };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [createImagePanel]);


const effectiveConfig = useMemo(() => {
  const panelCount = floatingPanels.filter(p => !p.isExiting).length;

  // Start dialing things down when there are lots of cards
  if (panelCount > 25) {
    return {
      ...config,
      gridScale: Math.max(80, (config.gridScale || 40) * 1.5),
      gridLineOpacity: config.gridLineOpacity * 0.7,
      dotOpacity: config.dotOpacity * 0.7,
    };
  }

  return config;
}, [config, floatingPanels]);


return (
  <div
    onMouseDown={(e) => {
      if (e.button === 1) {
        // Middle mouse: spawn panel
        handleMiddleClick(e);
      } else {
        // Left (and others): slicer / normal behavior
        handleMouseDown(e);
      }
    }}
    onMouseUp={handleMouseUp}
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    className="relative w-full h-full"
  >
    {/* Background layer driven by Settings background color when no wallpaper */}
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: hasWallpaper ? "transparent" : config.backgroundColor,
      }}
    />
	
{/* ░░ Visual Overlays ░░ */}
	{/* <NoiseOverlay /> */}  
      <EffectsOverlay type={config.overlayType} opacity={config.overlayOpacity} /> 

      {/* ░░ Dot Pattern Background ░░ */}
/*       {config.backgroundType === 'dotpattern' && (
        <DotPatternCanvas config={config} panels={floatingPanels.filter(p => !p.isExiting)} />
      )} */

      {/* ░░ Draggable Toolbar ░░ */}
      <Toolbar onToolLaunch={handleToolLaunch} openToolIds={openToolIds} />

      {/* Settings button */}
      <button
        onClick={() => setShowSettings(true)}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2147483647,
          background: 'var(--gp-btn-bg)', border: '1px solid var(--gp-btn-border)',
          borderRadius: 'var(--gp-radius-md)', padding: 10,
          color: 'var(--gp-btn-text)', cursor: 'pointer',
          backdropFilter: 'blur(5px)', transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gp-btn-text-active)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--gp-btn-text)')}
      >
        <Settings size={20} />
      </button>

      <AnimatePresence>
{showSettings && (
      <SettingsPanel
        config={config}
        onConfigChange={setConfig}
        onReset={() => {
          setConfig(DEFAULT_CONFIG);
          setCanvasResetKey((k) => k + 1);
        }}
        onClose={() => setShowSettings(false)}
        onSaveToFile={exportToFile}
        onLoadFromFile={importFromFile}
        wallpaper={wallpaper}
        wallpaperMode={wallpaperMode}
        onWallpaperChange={setWallpaper}
        onWallpaperModeChange={setWallpaperMode}
      />
    )}

      </AnimatePresence>

      {/* ░░ Dot Grid Canvas ░░ */}
      <DotGridCanvas
        key={`${canvasResetKey}-${effectiveConfig.gridScale || 40}`}
        config={effectiveConfig}
        panelX={panelPos.x} panelY={panelPos.y} panelWidth={panelSize.width} panelHeight={panelSize.height}
        pulses={pulses} mousePos={mousePos}
        panels={floatingPanels.filter(p => !p.isExiting)}
        connections={connections} connectionDrag={connectionDrag}
        sliceTrail={sliceTrail} cutConnections={cutConnections}
        onCutAnimationComplete={handleCutAnimationComplete}
      />

      {/* Floating panels */}
      <AnimatePresence>
        {floatingPanels.map(panel => (
          <FloatingPanel
            key={panel.id}
            id={panel.id}
            initialX={panel.x} initialY={panel.y}
            initialWidth={panel.width} initialHeight={panel.height}
            config={config}
            isTopPanel={panel.id === topPanelId}
            isExiting={panel.isExiting}
            title={panel.title}
            isMinimized={panel.isMinimized}
            type={panel.type}
            content={panel.content}
            panelColor={panel.panelColor}
            toolId={(panel.content?.toolId as string) || undefined}
            onPositionChange={handleFloatingPanelPositionChange}
            onSizeChange={handleFloatingPanelSizeChange}
            onBounce={handleBounce}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDismiss={handleFloatingPanelDismiss}
            onConnectionDragStart={handleConnectionDragStart}
            onConnectionDragMove={handleConnectionDragMove}
            onConnectionDragEnd={handleConnectionDragEnd}
            onDataChange={handleDataChange}
          />
        ))}
      </AnimatePresence>

      {/* Clear All button (no keyboard shortcut) */}
      <AnimatePresence>
        {floatingPanels.filter(p => !p.isExiting).length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => { e.stopPropagation(); soundEffects.playQuickStartClick(); clearAll(); }}
            style={{ position: 'fixed', top: 32, right: 70, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 12, color: 'var(--gp-text-dim)' }}>Clear all</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div style={{ position: 'fixed', bottom: 32, left: 32, maxWidth: 320, zIndex: 10 }}>
        <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--gp-text)', opacity: 0.8 }}>Node Editor Canvas</h1>
        <p style={{ fontSize: 14, color: 'var(--gp-text-muted)', marginTop: 6, lineHeight: 1.57, opacity: 0.7 }}>
          Middle-click anywhere to spawn nodes. Drag from the corner square to connect them. Slice through lines to cut connections.
        </p>
      </div>

      {/* Keyboard shortcuts */}
      <div className="keyboard-shortcuts" style={{ position: 'fixed', bottom: 32, right: 32, display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px 10px', alignItems: 'center', zIndex: 10 }}>
        {[['Snap to grid', '⇧ Shift'], ['Scale from center', '⌘ + Drag'], ['Lock aspect ratio', '⌥ + Drag']].map(([label, shortcut]) => (
          <React.Fragment key={label}>
            <span style={{ fontSize: 12, color: 'var(--gp-text-dim)', textAlign: 'right' }}>{label}</span>
            <span style={{ padding: '3px 7px', backgroundColor: 'var(--gp-surface)', borderRadius: 'var(--gp-radius-sm)', fontSize: 11, fontWeight: 500, color: 'var(--gp-text-muted)', fontFamily: 'var(--gp-font-mono)', minWidth: 72, textAlign: 'center' }}>{shortcut}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
