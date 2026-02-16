// ============================================================================
// ░░ DOT PATTERN CANVAS ░░
// Full-screen dot pattern background with mouse warp effect
// Supports circle, square, and custom text/unicode shapes
// ============================================================================

import { useEffect, useRef } from 'react';
import type { PhysicsConfig, DotShape } from '@/types/grid';

interface DotPatternCanvasProps {
  config: PhysicsConfig;
  panels: Array<{ x: number; y: number; width: number; height: number; isMinimized?: boolean }>;
}

export default function DotPatternCanvas({ config, panels }: DotPatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100, active: false });
  const configRef = useRef(config);
  const panelsRef = useRef(panels);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { panelsRef.current = panels; }, [panels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onMouseLeave = () => { mouseRef.current.active = false; };

    // ░░ Panel push displacement (same warp as grid) ░░
    const getPanelPush = (bx: number, by: number) => {
      let px = 0, py = 0;
      const maxDist = 400;
      const pushStrength = 25;
      for (const fp of panelsRef.current) {
        const eh = fp.isMinimized ? 40 : fp.height;
        const closestX = Math.max(fp.x, Math.min(bx, fp.x + fp.width));
        const closestY = Math.max(fp.y, Math.min(by, fp.y + eh));
        const dx = bx - closestX, dy = by - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < maxDist) {
          const norm = Math.min(dist / maxDist, 1);
          const push = Math.pow(1 - norm, 2) * pushStrength;
          px += (dx / dist) * push;
          py += (dy / dist) * push;
        }
      }
      return { x: px, y: py };
    };

    const render = () => {
      const {
        dotPatternSize: dotSize,
        dotPatternSpacing: spacing,
        dotPatternColor: color,
        dotPatternGlow: glow,
        dotPatternShape: shape,
        dotPatternText: text,
      } = configRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      const mouseRange = 150;

      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          let cx = x * spacing;
          let cy = y * spacing;

          // ░░ Panel warp displacement ░░
          const push = getPanelPush(cx, cy);
          cx += push.x;
          cy += push.y;

          let size = dotSize;
          let opacity = 0.15;

          // ░░ Panel proximity effect (opacity & size boost near panels) ░░
          const panelRange = 300;
          for (const fp of panelsRef.current) {
            const eh = fp.isMinimized ? 40 : fp.height;
            const closestX = Math.max(fp.x, Math.min(cx, fp.x + fp.width));
            const closestY = Math.max(fp.y, Math.min(cy, fp.y + eh));
            const pdx = cx - closestX, pdy = cy - closestY;
            const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pDist < panelRange) {
              const pEffect = 1 - (pDist / panelRange);
              opacity = Math.max(opacity, 0.15 + pEffect * 0.6);
              size = Math.max(size, dotSize * (1 + pEffect * 0.8));
            }
          }

          // ░░ Mouse proximity effect ░░
          if (mouseRef.current.active) {
            const dx = cx - mouseRef.current.x;
            const dy = cy - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouseRange) {
              const effect = 1 - (dist / mouseRange);
              size = Math.max(size, dotSize * (1 + effect * 1.5));
              opacity = Math.max(opacity, 0.15 + effect * 0.85);
            }
          }

          ctx.globalAlpha = opacity;

          // ░░ Draw shape ░░
          drawDot(ctx, cx, cy, size, shape, color, text);

          // ░░ Glow effect ░░
          if (glow && opacity > 0.5) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            drawDot(ctx, cx, cy, size, shape, color, text);
            ctx.shadowBlur = 0;
          }
        }
      }
      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    resize();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ░░ Shape Rendering Helper ░░
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: DotShape,
  color: string,
  text: string,
) {
  ctx.fillStyle = color;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'square') {
    const half = size;
    ctx.fillRect(x - half, y - half, half * 2, half * 2);
  } else if (shape === 'text') {
    ctx.font = `${Math.max(6, size * 6)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || '·', x, y);
  }
}
