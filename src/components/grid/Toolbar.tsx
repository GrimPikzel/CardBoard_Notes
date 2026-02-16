// ============================================================================
// ░░ DRAGGABLE TOOLBAR ░░
// Main icon that opens a horizontal toolbar with tool panel launchers.
// Draggable, lockable in place, persisted position & lock state.
// ============================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grip, Lock, Unlock, Image, Type, PenTool, Pipette, Zap } from 'lucide-react';

// ░░ Tool Definition ░░
export interface ToolDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultSize?: { width: number; height: number };
}

// ░░ Default Tools (Dither/ASCII is first) ░░
const TOOLS: ToolDefinition[] = [
  { id: 'dither-ascii', label: 'Dither / ASCII', icon: <Zap size={18} />, defaultSize: { width: 700, height: 500 } },
  { id: 'image-editor', label: 'Image Editor', icon: <Image size={18} /> },
  { id: 'text-editor', label: 'Text Editor', icon: <Type size={18} /> },
  { id: 'draw-tool', label: 'Draw Tool', icon: <PenTool size={18} /> },
  { id: 'color-picker', label: 'Color Picker', icon: <Pipette size={18} /> },
];

// Export for use by GridPlayground
export { TOOLS };

// ░░ Toolbar State (persisted separately) ░░
export interface ToolbarState {
  x: number;
  y: number;
  isLocked: boolean;
  isOpen: boolean;
}

const TOOLBAR_STORAGE_KEY = 'grid-playground-toolbar';

const getInitialToolbarState = (): ToolbarState => {
  try {
    const stored = localStorage.getItem(TOOLBAR_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { x: 20, y: 20, isLocked: false, isOpen: false };
};

interface ToolbarProps {
  onToolLaunch: (toolId: string) => void;
  openToolIds?: string[];
}

export default function Toolbar({ onToolLaunch, openToolIds = [] }: ToolbarProps) {
  const [state, setState] = useState<ToolbarState>(getInitialToolbarState);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(TOOLBAR_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const toggleOpen = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const toggleLock = useCallback(() => {
    setState(prev => ({ ...prev, isLocked: !prev.isLocked }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    const startMouseX = e.clientX, startMouseY = e.clientY;
    const startX = state.x, startY = state.y;
    let hasMoved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMouseX, dy = moveEvent.clientY - startMouseY;
      if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > 3) { hasMoved = true; setIsDragging(true); }
      if (hasMoved) {
        const newX = Math.max(0, Math.min(window.innerWidth - 48, startX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 48, startY + dy));
        setState(prev => ({ ...prev, x: newX, y: newY }));
      }
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      setTimeout(() => setIsDragging(false), 50);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [state.isLocked, state.x, state.y]);

  const handleToolClick = useCallback((toolId: string) => {
    onToolLaunch(toolId);
  }, [onToolLaunch]);

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', left: state.x, top: state.y, zIndex: 2147483646,
        display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none',
      }}
    >
      {/* ░░ Main Toolbar Icon / Drag Handle ░░ */}
      <motion.button
        onMouseDown={handleMouseDown}
        onClick={() => { if (!isDragging) toggleOpen(); }}
        whileTap={state.isLocked ? {} : { scale: 0.95 }}
        className="btn-skin"
        style={{
          width: 42, height: 42, borderRadius: 'var(--gp-radius-md, 10px)',
          border: '1px solid var(--gp-btn-border, rgba(255,255,255,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: state.isLocked ? 'pointer' : 'grab',
          color: state.isOpen ? 'var(--gp-btn-text-active, #fff)' : 'var(--gp-btn-text, #888)',
          position: 'relative',
        }}
        title={state.isLocked ? 'Click to toggle toolbar' : 'Drag to move, click to toggle'}
      >
        <Grip size={20} />
        {state.isLocked && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--gp-lock-color, #f59e0b)',
          }} />
        )}
      </motion.button>

      {/* ░░ Expanded Toolbar ░░ */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0, x: -10 }}
            animate={{ opacity: 1, width: 'auto', x: 0 }}
            exit={{ opacity: 0, width: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}
          >
            {TOOLS.map((tool, index) => {
              const isOpen = openToolIds.includes(tool.id);
              return (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => handleToolClick(tool.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="btn-skin"
                  style={{
                    width: 38, height: 38, borderRadius: 'var(--gp-radius-md, 8px)',
                    border: isOpen
                      ? '1px solid var(--gp-accent-border, rgba(59,130,246,0.5))'
                      : '1px solid var(--gp-btn-border, rgba(255,255,255,0.08))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: isOpen ? 'var(--gp-accent, #3b82f6)' : 'var(--gp-btn-text, #a3a3a3)',
                    flexShrink: 0,
                  }}
                  title={isOpen ? `${tool.label} (focus)` : tool.label}
                >
                  {tool.icon}
                </motion.button>
              );
            })}

            {/* ░░ Lock/Unlock Button ░░ */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: TOOLS.length * 0.04 }}
              onClick={toggleLock}
              onMouseDown={(e) => e.stopPropagation()}
              className="btn-skin"
              style={{
                width: 38, height: 38, borderRadius: 'var(--gp-radius-md, 8px)',
                border: `1px solid ${state.isLocked ? 'var(--gp-accent-border, rgba(245,158,11,0.3))' : 'var(--gp-btn-border, rgba(255,255,255,0.08))'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: state.isLocked ? 'var(--gp-lock-color, #f59e0b)' : 'var(--gp-btn-text, #a3a3a3)',
                flexShrink: 0,
              }}
              title={state.isLocked ? 'Unlock position' : 'Lock position'}
            >
              {state.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
