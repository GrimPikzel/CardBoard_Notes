import React, { useRef, useEffect } from 'react';
import type { FloatingPanelData, PanelConnection, ConnectionDrag, SlicePoint, CutConnection, PulseEvent, Particle, ParticleShape, ParticleColor, PhysicsConfig } from '@/types/grid';
import { panelSounds } from '@/utils/PanelSoundEffects';

// ░░ Hex to RGB Helper ░░
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 160, g: 160, b: 160 };
};

// ░░ DOT GRID CANVAS - Props Interface ░░
interface DotGridCanvasProps {
  config: PhysicsConfig;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  pulses: PulseEvent[];
  mousePos: { x: number; y: number } | null;
  panels: FloatingPanelData[];
  connections: PanelConnection[];
  connectionDrag: ConnectionDrag | null;
  sliceTrail: SlicePoint[];
  cutConnections: CutConnection[];
  onCutAnimationComplete: (id: string) => void;
}

export default function DotGridCanvas({
  config,
  panelX, panelY, panelWidth, panelHeight,
  pulses, mousePos, panels, connections,
  connectionDrag, sliceTrail, cutConnections,
  onCutAnimationComplete,
}: DotGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dotsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number; size: number; targetSize: number; brightness: number }>>(new Map());
  const lastPanelRef = useRef({ x: panelX, y: panelY, width: panelWidth, height: panelHeight });
  const pulsesRef = useRef<PulseEvent[]>(pulses);
  const mousePosRef = useRef<{ x: number; y: number } | null>(mousePos);
  const panelsRef = useRef<FloatingPanelData[]>(panels);
  const connectionsRef = useRef<PanelConnection[]>(connections);
  const connectionDragRef = useRef<ConnectionDrag | null>(connectionDrag);
  const sliceTrailRef = useRef<SlicePoint[]>(sliceTrail);
  const cutConnectionsRef = useRef<CutConnection[]>(cutConnections);
  const onCutAnimationCompleteRef = useRef(onCutAnimationComplete);
  const lastPanelPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const panelVelocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const bouncyParticlesRef = useRef<Particle[]>([]);
  const lastPulseTimeRef = useRef(0);
  const lastParticleSoundTimeRef = useRef(0);
  const configRef = useRef(config);

  // ░░ Keep refs up to date ░░
  connectionDragRef.current = connectionDrag;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gridSize = configRef.current.gridScale || 40;
    const maxDist = 400;
    const pushStrength = 25;
    const springStiffness = 0.08;
    const damping = 0.75;

    // Particle settings
    const particleCount = 12;
    const particleSpeed = 8;
    const particleGravity = 0.15;
    const particleFriction = 0.98;
    const particleLifespan = 1200;

    // Bouncy particle settings
    const bouncyParticleCount = 16;
    const bouncyParticleSpeed = 6;
    const bouncyParticleGravity = 0.12;
    const bouncyParticleFriction = 0.99;
    const bouncyParticleLifespan = 2500;
    const bouncyBounceDamping = 0.7;
    const bouncySurfaceFriction = 0.6;
    const particleCollisionDamping = 0.8;

    const randomShape = (): ParticleShape => {
      const shapes: ParticleShape[] = ['circle', 'triangle', 'square'];
      return shapes[Math.floor(Math.random() * shapes.length)];
    };

    const spawnParticles = (x: number, y: number, intensity: number) => {
      const count = Math.floor(particleCount * (0.5 + intensity * 0.5));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = particleSpeed * (0.5 + Math.random() * 0.5) * intensity;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.3,
          size: 3 + Math.random() * 4 * intensity, opacity: 0.8 + Math.random() * 0.2,
          life: particleLifespan, maxLife: particleLifespan, shape: randomShape(),
        });
      }
    };

    const spawnBouncyParticles = (x: number, y: number, intensity: number) => {
      const count = Math.floor(bouncyParticleCount * (0.5 + intensity * 0.5));
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
        const speed = bouncyParticleSpeed * (0.7 + Math.random() * 0.6) * intensity;
        const isBlue = Math.random() < 0.4;
        const color: ParticleColor = isBlue ? 'blue' : 'cyan';
        const size = isBlue ? 1 + Math.random() * 2 * intensity : 2 + Math.random() * 4 * intensity;
        bouncyParticlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.2,
          size, opacity: 0.9,
          life: bouncyParticleLifespan, maxLife: bouncyParticleLifespan, shape: randomShape(), color,
        });
      }
    };

    // Shape drawing helpers
    const drawRoundedTriangle = (ctx: CanvasRenderingContext2D, size: number, radius: number) => {
      const h = size * 0.866;
      const points = [{ x: 0, y: -size }, { x: -h, y: size * 0.5 }, { x: h, y: size * 0.5 }];
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const curr = points[i], next = points[(i + 1) % 3], prev = points[(i + 2) % 3];
        const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const offset = Math.min(radius, len1 / 2, len2 / 2);
        const p1x = curr.x - (dx1 / len1) * offset, p1y = curr.y - (dy1 / len1) * offset;
        const p2x = curr.x + (dx2 / len2) * offset, p2y = curr.y + (dy2 / len2) * offset;
        if (i === 0) ctx.moveTo(p1x, p1y); else ctx.lineTo(p1x, p1y);
        ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
      }
      ctx.closePath();
    };

    const drawRoundedSquare = (ctx: CanvasRenderingContext2D, size: number, radius: number) => {
      const half = size * 0.7;
      const r = Math.min(radius, half);
      ctx.beginPath();
      ctx.moveTo(-half + r, -half);
      ctx.lineTo(half - r, -half); ctx.quadraticCurveTo(half, -half, half, -half + r);
      ctx.lineTo(half, half - r); ctx.quadraticCurveTo(half, half, half - r, half);
      ctx.lineTo(-half + r, half); ctx.quadraticCurveTo(-half, half, -half, half - r);
      ctx.lineTo(-half, -half + r); ctx.quadraticCurveTo(-half, -half, -half + r, -half);
      ctx.closePath();
    };

    const drawShape = (ctx: CanvasRenderingContext2D, p: Particle, fillColor: string, strokeColor: string, lineWidth: number) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2); ctx.closePath(); }
      else if (p.shape === 'triangle') drawRoundedTriangle(ctx, p.size, p.size * 0.3);
      else drawRoundedSquare(ctx, p.size, p.size * 0.25);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const updateParticles = (deltaTime: number) => {
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= deltaTime;
        if (p.life <= 0) return false;
        p.vy += particleGravity; p.vx *= particleFriction; p.vy *= particleFriction;
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed;
        return true;
      });
    };

    const updateBouncyParticles = (deltaTime: number) => {
      const particles = bouncyParticlesRef.current;
      const floatingPanels = panelsRef.current;

      for (const fp of floatingPanels) {
        const lastPos = lastPanelPositionsRef.current.get(fp.id);
        panelVelocitiesRef.current.set(fp.id, lastPos ? { vx: fp.x - lastPos.x, vy: fp.y - lastPos.y } : { vx: 0, vy: 0 });
        lastPanelPositionsRef.current.set(fp.id, { x: fp.x, y: fp.y });
      }

      // Particle-to-particle collision
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i], p2 = particles[j];
          const dx = p2.x - p1.x, dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = (p1.size + p2.size) * 0.6;
          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist, ny = dy / dist;
            p1.x -= nx * overlap * 0.5; p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5; p2.y += ny * overlap * 0.5;
            const dvn = (p1.vx - p2.vx) * nx + (p1.vy - p2.vy) * ny;
            if (dvn > 0) {
              const impulse = dvn * particleCollisionDamping;
              p1.vx -= impulse * nx; p1.vy -= impulse * ny;
              p2.vx += impulse * nx; p2.vy += impulse * ny;
            }
          }
        }
      }

      bouncyParticlesRef.current = particles.filter(p => {
        if (p.y > height + 200 || p.x < -200 || p.x > width + 200) return false;
        p.vy += bouncyParticleGravity; p.vx *= bouncyParticleFriction; p.vy *= bouncyParticleFriction;
        const pad = p.size * 0.9;
        let collided = false;
        let collisionSpeed = 0;
        let restingOnPanel: { panelVel: { vx: number; vy: number }; collisionTop: number; panelLeft: number; panelRight: number } | null = null;

        for (const fp of floatingPanels) {
          const effectiveHeight = fp.isMinimized ? 40 : fp.height;
          const pLeft = fp.x, pRight = fp.x + fp.width, pTop = fp.y, pBottom = fp.y + effectiveHeight;
          const panelVel = panelVelocitiesRef.current.get(fp.id) || { vx: 0, vy: 0 };
          const cLeft = pLeft - pad, cRight = pRight + pad, cTop = pTop - pad, cBottom = pBottom + pad;
          const nextX = p.x + p.vx, nextY = p.y + p.vy;
          const isInX = p.x >= cLeft && p.x <= cRight, isInY = p.y >= cTop && p.y <= cBottom;
          const wouldBeInX = nextX >= cLeft && nextX <= cRight, wouldBeInY = nextY >= cTop && nextY <= cBottom;
          const panelSpeed = Math.sqrt(panelVel.vx * panelVel.vx + panelVel.vy * panelVel.vy);
          const panelMovingIntoParticle = panelSpeed > 0.5 && (
            (panelVel.vx > 0 && p.x > pRight - 20 && p.x < pRight + pad + 10 && isInY) ||
            (panelVel.vx < 0 && p.x < pLeft + 20 && p.x > pLeft - pad - 10 && isInY) ||
            (panelVel.vy > 0 && p.y > pBottom - 20 && p.y < pBottom + pad + 10 && isInX) ||
            (panelVel.vy < 0 && p.y < pTop + 20 && p.y > pTop - pad - 10 && isInX)
          );

          if (panelMovingIntoParticle || (wouldBeInX && wouldBeInY) || (isInX && isInY)) {
            const distLeft = Math.abs(p.x - cLeft), distRight = Math.abs(p.x - cRight);
            const distTop = Math.abs(p.y - cTop), distBottom = Math.abs(p.y - cBottom);
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            const randAngle = ((1 + Math.random() * 2) * Math.PI / 180) * (Math.random() < 0.5 ? 1 : -1);
            const mt = 0.8;

            if (minDist === distTop) {
              if (p.vy >= 0 && Math.abs(p.vy) < 1.5 && panelVel.vy >= -5) {
                restingOnPanel = { panelVel, collisionTop: cTop, panelLeft: pLeft, panelRight: pRight };
              } else {
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const angle = Math.atan2(-p.vy, p.vx) + randAngle;
                p.vx = Math.cos(angle) * speed * bouncyBounceDamping + panelVel.vx * mt;
                p.vy = Math.sin(angle) * speed * bouncyBounceDamping + panelVel.vy * mt;
                p.y = cTop - 1; collided = true; collisionSpeed = speed; break;
              }
            } else {
              const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
              let angle: number;
              if (minDist === distLeft || minDist === distRight) {
                angle = Math.atan2(p.vy, -p.vx) + randAngle;
                if (minDist === distLeft) p.x = cLeft - 1; else p.x = cRight + 1;
              } else {
                angle = Math.atan2(-p.vy, p.vx) + randAngle;
                p.y = cBottom + 1;
              }
              p.vx = Math.cos(angle) * speed * bouncyBounceDamping + panelVel.vx * mt;
              p.vy = Math.sin(angle) * speed * bouncyBounceDamping + panelVel.vy * mt;
              p.rotationSpeed = -p.rotationSpeed * 1.2;
              collided = true; collisionSpeed = speed; break;
            }
          }
        }

        if (collided && collisionSpeed > 2.5) {
          const now = performance.now();
          if (now - lastParticleSoundTimeRef.current > 20) {
            const norm = Math.min((collisionSpeed - 2.5) / 8, 1);
            panelSounds.play(0.01 + norm * 0.03);
            lastParticleSoundTimeRef.current = now;
          }
        }

        if (!collided && restingOnPanel) {
          const { panelVel, collisionTop, panelLeft, panelRight } = restingOnPanel;
          if (panelVel.vy < -5) {
            const maxVel = 8;
            p.vx += Math.max(-maxVel, Math.min(maxVel, panelVel.vx * 0.4));
            p.vy = Math.max(-maxVel, panelVel.vy * 0.4);
          } else {
            p.vx = panelVel.vx + (p.vx - panelVel.vx) * bouncySurfaceFriction;
            p.vy = 0; p.y = collisionTop - 1; p.rotationSpeed *= 0.85;
            const margin = pad + 2;
            if (p.x < panelLeft + margin) { p.x = panelLeft + margin; p.vx = Math.max(panelVel.vx, p.vx); }
            if (p.x > panelRight - margin) { p.x = panelRight - margin; p.vx = Math.min(panelVel.vx, p.vx); }
          }
          p.x += p.vx; p.rotation += p.rotationSpeed;
          return true;
        }

        p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed;
        return true;
      });
    };

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const initDots = () => {
      dotsRef.current.clear();
      for (let gx = -gridSize; gx < width + gridSize * 2; gx += gridSize) {
        for (let gy = -gridSize; gy < height + gridSize * 2; gy += gridSize) {
          dotsRef.current.set(`${gx},${gy}`, { x: gx, y: gy, vx: 0, vy: 0, size: 1, targetSize: 1, brightness: 1 });
        }
      }
    };
    initDots();

    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      // ░░ Spawn particles from new pulses ░░
      for (const pulse of pulsesRef.current) {
        if (pulse.time > lastPulseTimeRef.current) {
          if (configRef.current.particlesEnabled) {
            spawnParticles(pulse.x, pulse.y, pulse.intensity);
            spawnBouncyParticles(pulse.x, pulse.y, pulse.intensity);
          }
          lastPulseTimeRef.current = pulse.time;
        }
      }

      if (configRef.current.particlesEnabled) updateParticles(deltaTime);

      const currentPanel = lastPanelRef.current;
      const panelLeft = currentPanel.x, panelRight = currentPanel.x + currentPanel.width;
      const panelTop = currentPanel.y, panelBottom = currentPanel.y + currentPanel.height;

      ctx.clearRect(0, 0, width, height);

      // ░░ Parse config colors for this frame ░░
      const gridRgb = hexToRgb(configRef.current.gridLineColor);
      const dotRgb = hexToRgb(configRef.current.dotColor);
      const particleRgb = hexToRgb(configRef.current.particleColor);
      const gridLineOp = configRef.current.gridLineOpacity;
      const dotOp = configRef.current.dotOpacity;
      const particleOp = configRef.current.particleOpacity;

      const pulseSpeedPx = 400, pulseWidth = 80, pulseDuration = 2000;
      const denseGridSize = gridSize / 2;

      const getPulseIntensity = (x: number, y: number) => {
        if (!configRef.current.rippleEnabled) return 0;
        let maxIntensity = 0;
        for (const pulse of pulsesRef.current) {
          const age = now - pulse.time;
          if (age > pulseDuration) continue;
          const s = 0.5 + pulse.intensity * 0.5;
          const radius = (age / 1000) * pulseSpeedPx * s;
          const distFromWave = Math.abs(Math.sqrt((x - pulse.x) ** 2 + (y - pulse.y) ** 2) - radius);
          const w = pulseWidth * s;
          if (distFromWave < w) {
            maxIntensity = Math.max(maxIntensity, (1 - distFromWave / w) * (1 - age / pulseDuration) * pulse.intensity);
          }
        }
        return maxIntensity;
      };

      const getHoverIntensity = (x: number, y: number) => {
        const mouse = mousePosRef.current;
        if (!mouse) return 0;
        const dist = Math.sqrt((x - mouse.x) ** 2 + (y - mouse.y) ** 2);
        if (dist > 120) return 0;
        return Math.pow(1 - dist / 120, 2) * 0.6;
      };

      const getPanelPush = (baseX: number, baseY: number, pL: number, pR: number, pT: number, pB: number) => {
        const closestX = Math.max(pL, Math.min(baseX, pR));
        const closestY = Math.max(pT, Math.min(baseY, pB));
        const dx = baseX - closestX, dy = baseY - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const norm = Math.min(dist / maxDist, 1);
        const push = dist > 0 ? Math.pow(1 - norm, 2) * pushStrength : 0;
        return { x: dist > 0 ? (dx / dist) * push : 0, y: dist > 0 ? (dy / dist) * push : 0 };
      };

      const getDisplacedPosition = (baseX: number, baseY: number) => {
        let tpx = 0, tpy = 0;
        const mainPush = getPanelPush(baseX, baseY, panelLeft, panelRight, panelTop, panelBottom);
        tpx += mainPush.x; tpy += mainPush.y;
        for (const fp of panelsRef.current) {
          const eh = fp.isMinimized ? 40 : fp.height;
          const fpPush = getPanelPush(baseX, baseY, fp.x, fp.x + fp.width, fp.y, fp.y + eh);
          tpx += fpPush.x; tpy += fpPush.y;
        }
        return { x: baseX + tpx, y: baseY + tpy };
      };

      // ░░ Grid & Dots Rendering (skip when dotpattern background is active) ░░
      if (configRef.current.gridEnabled && configRef.current.backgroundType !== 'dotpattern') {
      // ░░ Dense grid (pulse-visible only, skip when no pulses) ░░
      const hasRecentPulses = pulsesRef.current.some(p => now - p.time < pulseDuration);
      if (hasRecentPulses) {
        for (let gx = -denseGridSize; gx < width + denseGridSize * 2; gx += denseGridSize) {
          for (let gy = -denseGridSize; gy < height + denseGridSize * 2; gy += denseGridSize) {
            if ((gx % gridSize === 0) && (gy % gridSize === 0)) continue;
            const pos = getDisplacedPosition(gx, gy);
            const pi = getPulseIntensity(pos.x, pos.y);
            if (pi < 0.05) continue;
            const nextPosH = getDisplacedPosition(gx + denseGridSize, gy);
            const avgH = (pi + getPulseIntensity(nextPosH.x, nextPosH.y)) / 2;
            if (avgH > 0.05) {
              ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(nextPosH.x, nextPosH.y);
              ctx.strokeStyle = `rgba(${gridRgb.r}, ${gridRgb.g}, ${gridRgb.b}, ${avgH * gridLineOp})`; ctx.lineWidth = 0.3 + avgH * 0.5; ctx.stroke();
            }
            const nextPosV = getDisplacedPosition(gx, gy + denseGridSize);
            const avgV = (pi + getPulseIntensity(nextPosV.x, nextPosV.y)) / 2;
            if (avgV > 0.05) {
              ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(nextPosV.x, nextPosV.y);
              ctx.strokeStyle = `rgba(${gridRgb.r}, ${gridRgb.g}, ${gridRgb.b}, ${avgV * gridLineOp})`; ctx.lineWidth = 0.3 + avgV * 0.5; ctx.stroke();
            }
          }
        }
      }

      // Main wireframe lines
      ctx.lineWidth = 0.5;
      dotsRef.current.forEach((dot, key) => {
        const [gxStr, gyStr] = key.split(',');
        const gx = parseInt(gxStr), gy = parseInt(gyStr);
        const rightDot = dotsRef.current.get(`${gx + gridSize},${gy}`);
        const bottomDot = dotsRef.current.get(`${gx},${gy + gridSize}`);
        let lineMinDist = Infinity;
        const mcx = Math.max(panelLeft, Math.min(dot.x, panelRight));
        const mcy = Math.max(panelTop, Math.min(dot.y, panelBottom));
        lineMinDist = Math.min(lineMinDist, Math.sqrt((dot.x - mcx) ** 2 + (dot.y - mcy) ** 2));
        for (const fp of panelsRef.current) {
          const eh = fp.isMinimized ? 40 : fp.height;
          const fcx = Math.max(fp.x, Math.min(dot.x, fp.x + fp.width));
          const fcy = Math.max(fp.y, Math.min(dot.y, fp.y + eh));
          lineMinDist = Math.min(lineMinDist, Math.sqrt((dot.x - fcx) ** 2 + (dot.y - fcy) ** 2));
        }
        const normD = Math.min(lineMinDist / maxDist, 1);
        const baseLineOpacity = (0.25 - normD * 0.2) * 0.5;
        const pulseI = getPulseIntensity(dot.x, dot.y);
        const hoverI = getHoverIntensity(dot.x, dot.y);

        const drawLine = (neighbor: typeof dot, nPulse: number, nHover: number) => {
          const avgEffect = Math.max((pulseI + nPulse) / 2, (hoverI + nHover) / 2);
          const lineOpacity = baseLineOpacity + avgEffect * 0.8;
          if (lineOpacity > 0.01) {
            const color = avgEffect > 0.1
              ? `rgba(${gridRgb.r}, ${gridRgb.g}, ${gridRgb.b}, ${Math.max(0, (lineOpacity + avgEffect * 0.7) * gridLineOp)})`
              : `rgba(${gridRgb.r}, ${gridRgb.g}, ${gridRgb.b}, ${Math.max(0, lineOpacity * gridLineOp)})`;
            ctx.beginPath(); ctx.moveTo(dot.x, dot.y); ctx.lineTo(neighbor.x, neighbor.y);
            ctx.lineWidth = 0.5 + avgEffect * 2; ctx.strokeStyle = color; ctx.stroke();
          }
        };

        if (rightDot) drawLine(rightDot, getPulseIntensity(rightDot.x, rightDot.y), getHoverIntensity(rightDot.x, rightDot.y));
        if (bottomDot) drawLine(bottomDot, getPulseIntensity(bottomDot.x, bottomDot.y), getHoverIntensity(bottomDot.x, bottomDot.y));
      });

      // Draw dots with spring physics
      dotsRef.current.forEach((dot, key) => {
        const [gxStr, gyStr] = key.split(',');
        const gx = parseInt(gxStr), gy = parseInt(gyStr);
        let totalPushX = 0, totalPushY = 0, minDist = Infinity;
        const mainPush = getPanelPush(gx, gy, panelLeft, panelRight, panelTop, panelBottom);
        totalPushX += mainPush.x; totalPushY += mainPush.y;
        const mainCX = Math.max(panelLeft, Math.min(gx, panelRight));
        const mainCY = Math.max(panelTop, Math.min(gy, panelBottom));
        minDist = Math.min(minDist, Math.sqrt((gx - mainCX) ** 2 + (gy - mainCY) ** 2));
        for (const fp of panelsRef.current) {
          const eh = fp.isMinimized ? 40 : fp.height;
          const fpPush = getPanelPush(gx, gy, fp.x, fp.x + fp.width, fp.y, fp.y + eh);
          totalPushX += fpPush.x; totalPushY += fpPush.y;
          const fcx = Math.max(fp.x, Math.min(gx, fp.x + fp.width));
          const fcy = Math.max(fp.y, Math.min(gy, fp.y + eh));
          minDist = Math.min(minDist, Math.sqrt((gx - fcx) ** 2 + (gy - fcy) ** 2));
        }
        const targetX = gx + totalPushX, targetY = gy + totalPushY;
        const dist = minDist;
        const normD = Math.min(dist / maxDist, 1);
        dot.vx = (dot.vx + (targetX - dot.x) * springStiffness) * damping;
        dot.vy = (dot.vy + (targetY - dot.y) * springStiffness) * damping;
        dot.x += dot.vx; dot.y += dot.vy;
        const ripple = Math.sin(normD * Math.PI);
        dot.targetSize = 0.8 + ripple * 2;
        dot.size += (dot.targetSize - dot.size) * 0.15;
        // ░░ Performance: only draw dots within render distance ░░
        if (dist < 500) {
          const bRadius = 110;
          const bFalloff = Math.pow(Math.min(dist / bRadius, 1), 2);
          const opacity = (0.12 + (1 - bFalloff) * 0.8) * dotOp;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, Math.max(0.5, dot.size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${dotRgb.r}, ${dotRgb.g}, ${dotRgb.b}, ${Math.max(0, opacity)})`;
          ctx.fill();
        }
      });
      } // ░░ End Grid & Dots ░░

      // ░░ Connection path drawing ░░
      const snapToGrid = (v: number) => Math.round(v / gridSize) * gridSize;
      const getDotPos = (gx: number, gy: number) => {
        const dot = dotsRef.current.get(`${gx},${gy}`);
        return dot ? { x: dot.x, y: dot.y } : { x: gx, y: gy };
      };

      const buildLPath = (sx: number, sy: number, ex: number, ey: number, horizontalFirst: boolean) => {
        const points: { gx: number; gy: number }[] = [];
        if (horizontalFirst) {
          const step = sx < ex ? gridSize : -gridSize;
          if (sx !== ex) for (let gx = sx; step > 0 ? gx <= ex : gx >= ex; gx += step) points.push({ gx, gy: sy });
          else points.push({ gx: sx, gy: sy });
          const yStep = sy < ey ? gridSize : -gridSize;
          if (sy !== ey) for (let gy = sy + yStep; yStep > 0 ? gy <= ey : gy >= ey; gy += yStep) points.push({ gx: ex, gy });
        } else {
          const step = sy < ey ? gridSize : -gridSize;
          if (sy !== ey) for (let gy = sy; step > 0 ? gy <= ey : gy >= ey; gy += step) points.push({ gx: sx, gy });
          else points.push({ gx: sx, gy: sy });
          const xStep = sx < ex ? gridSize : -gridSize;
          if (sx !== ex) for (let gx = sx + xStep; xStep > 0 ? gx <= ex : gx >= ex; gx += xStep) points.push({ gx, gy: ey });
        }
        return points;
      };

      const drawGridPath = (fromX: number, fromY: number, toX: number, toY: number, color: string, lw: number, alpha: number, animated = false) => {
        const sgx = snapToGrid(fromX), sgy = snapToGrid(fromY), egx = snapToGrid(toX), egy = snapToGrid(toY);
        const pathPoints = buildLPath(sgx, sgy, egx, egy, true);
        if (pathPoints.length < 2) return;
        const actualPoints = pathPoints.map(p => getDotPos(p.gx, p.gy));

        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(actualPoints[0].x, actualPoints[0].y);
        if (actualPoints.length === 2) ctx.lineTo(actualPoints[1].x, actualPoints[1].y);
        else {
          for (let i = 1; i < actualPoints.length - 1; i++) {
            const prev = actualPoints[i - 1], curr = actualPoints[i], next = actualPoints[i + 1];
            const mx1 = (prev.x + curr.x) / 2, my1 = (prev.y + curr.y) / 2;
            const mx2 = (curr.x + next.x) / 2, my2 = (curr.y + next.y) / 2;
            if (i === 1) ctx.lineTo(mx1, my1);
            ctx.quadraticCurveTo(curr.x, curr.y, mx2, my2);
          }
          ctx.lineTo(actualPoints[actualPoints.length - 1].x, actualPoints[actualPoints.length - 1].y);
        }
        ctx.stroke();

        // Energy flow animation
        if (animated && actualPoints.length >= 2) {
          const sampled: { x: number; y: number }[] = [];
          const sps = 8;
          if (actualPoints.length === 2) { sampled.push(actualPoints[0], actualPoints[1]); }
          else {
            sampled.push(actualPoints[0]);
            for (let i = 1; i < actualPoints.length - 1; i++) {
              const prev = actualPoints[i - 1], curr = actualPoints[i], next = actualPoints[i + 1];
              const mx1 = (prev.x + curr.x) / 2, my1 = (prev.y + curr.y) / 2;
              const mx2 = (curr.x + next.x) / 2, my2 = (curr.y + next.y) / 2;
              if (i === 1) for (let t = 1; t <= sps; t++) { const tt = t / sps; sampled.push({ x: actualPoints[0].x + (mx1 - actualPoints[0].x) * tt, y: actualPoints[0].y + (my1 - actualPoints[0].y) * tt }); }
              for (let t = 1; t <= sps; t++) { const tt = t / sps; sampled.push({ x: (1 - tt) * (1 - tt) * mx1 + 2 * (1 - tt) * tt * curr.x + tt * tt * mx2, y: (1 - tt) * (1 - tt) * my1 + 2 * (1 - tt) * tt * curr.y + tt * tt * my2 }); }
            }
            const lmx = (actualPoints[actualPoints.length - 2].x + actualPoints[actualPoints.length - 1].x) / 2;
            const lmy = (actualPoints[actualPoints.length - 2].y + actualPoints[actualPoints.length - 1].y) / 2;
            for (let t = 1; t <= sps; t++) { const tt = t / sps; sampled.push({ x: lmx + (actualPoints[actualPoints.length - 1].x - lmx) * tt, y: lmy + (actualPoints[actualPoints.length - 1].y - lmy) * tt }); }
          }
          const cumDist: number[] = [0];
          for (let i = 1; i < sampled.length; i++) {
            const dx = sampled[i].x - sampled[i - 1].x, dy = sampled[i].y - sampled[i - 1].y;
            cumDist.push(cumDist[i - 1] + Math.sqrt(dx * dx + dy * dy));
          }
          const totalLen = cumDist[cumDist.length - 1];
          if (totalLen > 20) {
            const spacing = 100, pw = 60, flowPos = (now * 0.12) % spacing;
            for (let i = 0; i < sampled.length - 1; i++) {
              const segMid = (cumDist[i] + cumDist[i + 1]) / 2;
              let brightness = 0;
              for (let off = -spacing; off <= totalLen + spacing; off += spacing) {
                const d = Math.abs(segMid - (flowPos + off));
                if (d < pw) brightness = Math.max(brightness, (Math.cos((d / pw) * Math.PI) + 1) / 2);
              }
              if (brightness > 0.02) {
                const connRgb = hexToRgb(configRef.current.connectionColor || '#3B82F6');
                ctx.save(); ctx.strokeStyle = `rgba(${connRgb.r}, ${Math.min(255, connRgb.g + 40)}, ${Math.min(255, connRgb.b + 40)}, ${brightness * 0.9})`; ctx.lineWidth = lw + brightness * 1.5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(sampled[i].x, sampled[i].y); ctx.lineTo(sampled[i + 1].x, sampled[i + 1].y); ctx.stroke(); ctx.restore();
              }
            }
          }
        }

        // Endpoints
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(actualPoints[0].x, actualPoints[0].y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(actualPoints[actualPoints.length - 1].x, actualPoints[actualPoints.length - 1].y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };

      // Draw established connections
      const currentPanels = panelsRef.current;
      for (const conn of connectionsRef.current) {
        const from = currentPanels.find(p => p.id === conn.fromPanelId);
        const to = currentPanels.find(p => p.id === conn.toPanelId);
        if (from && to) {
          const fromH = from.isMinimized ? 40 : from.height;
          const toH = to.isMinimized ? 40 : to.height;
          drawGridPath(from.x + from.width / 2, from.y + fromH / 2, to.x + to.width / 2, to.y + toH / 2, configRef.current.connectionColor || '#3B82F6', 2, 0.7, true);
        }
      }

      // Cut connection retraction
      const cutAnimDuration = 600;
      for (const cut of cutConnectionsRef.current) {
        const fp = currentPanels.find(p => p.id === cut.fromPanelId);
        const tp = currentPanels.find(p => p.id === cut.toPanelId);
        if (fp && tp) {
          const elapsed = now - cut.cutTime;
          const progress = Math.min(1, elapsed / cutAnimDuration);
          if (progress < 1) {
            const fcH = fp.isMinimized ? 40 : fp.height;
            const tcH = tp.isMinimized ? 40 : tp.height;
            const fc = { x: fp.x + fp.width / 2, y: fp.y + fcH / 2 };
            const tc = { x: tp.x + tp.width / 2, y: tp.y + tcH / 2 };
            const pathP = buildLPath(snapToGrid(fc.x), snapToGrid(fc.y), snapToGrid(tc.x), snapToGrid(tc.y), true);
            const actualP = pathP.map(p => getDotPos(p.gx, p.gy));
            let cutIdx = Math.floor(actualP.length / 2);
            let md = Infinity;
            actualP.forEach((ap, i) => { const d = Math.sqrt((ap.x - cut.cutX) ** 2 + (ap.y - cut.cutY) ** 2); if (d < md) { md = d; cutIdx = i; } });
            const ease = 1 - Math.pow(1 - progress, 3);
            const fadeAlpha = 0.7 * (1 - ease * 0.8);
            ctx.save(); ctx.strokeStyle = configRef.current.connectionColor || '#3B82F6'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = fadeAlpha;
            // From side
            const fromEnd = Math.max(1, cutIdx - Math.floor((cutIdx + 1) * ease));
            if (fromEnd > 0) {
              const pts = actualP.slice(0, fromEnd + 1);
              ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
              ctx.stroke();
            }
            // To side
            const toStart = Math.min(actualP.length - 2, cutIdx + Math.floor((actualP.length - cutIdx) * ease));
            if (toStart < actualP.length - 1) {
              const pts = actualP.slice(toStart);
              ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
              ctx.stroke();
            }
            ctx.restore();
          } else {
            onCutAnimationCompleteRef.current(cut.id);
          }
        }
      }

      // Active connection drag
      const currentDrag = connectionDragRef.current;
      if (currentDrag) {
        const from = currentPanels.find(p => p.id === currentDrag.fromPanelId);
        if (from) {
          const fromDragH = from.isMinimized ? 40 : from.height;
          const alpha = currentDrag.targetPanelId ? 0.85 : 0.5;
          const color = currentDrag.targetPanelId ? (configRef.current.connectionColor || '#3B82F6') : '#888888';
          drawGridPath(from.x + from.width / 2, from.y + fromDragH / 2, currentDrag.toX, currentDrag.toY, color, 2, alpha);
        }
      }

      // Slice trail
      const trail = sliceTrailRef.current;
      if (trail.length > 1) {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const point of trail) {
          if (now - point.time < 200) {
            if (!started) { ctx.moveTo(point.x, point.y); started = true; } else ctx.lineTo(point.x, point.y);
          }
        }
        const trailAlpha = trail.length > 0 ? Math.max(0, 1 - (now - trail[trail.length - 1].time) / 200) : 0;
        const trailRgb = hexToRgb(configRef.current.sliceTrailColor || '#b4b4b4');
        ctx.strokeStyle = `rgba(${trailRgb.r}, ${trailRgb.g}, ${trailRgb.b}, ${trailAlpha * 0.8})`;
        ctx.stroke(); ctx.restore();
      }

      // ░░ Update and draw particles ░░
      if (configRef.current.particlesEnabled) {
        updateBouncyParticles(deltaTime);
        const pr = particleRgb.r, pg = particleRgb.g, pb = particleRgb.b;
        for (const p of particlesRef.current) {
          const lifeRatio = p.life / p.maxLife;
          drawShape(ctx, p,
            `rgba(${pr}, ${pg}, ${pb}, ${p.opacity * lifeRatio * particleOp})`,
            `rgba(${Math.min(255, pr + 60)}, ${Math.min(255, pg + 60)}, ${Math.min(255, pb + 20)}, ${p.opacity * lifeRatio * 0.8 * particleOp})`, 0.5);
        }
        for (const p of bouncyParticlesRef.current) {
          if (p.color === 'blue') drawShape(ctx, p,
            `rgba(${pr}, ${pg}, ${pb}, ${p.opacity * 0.95 * particleOp})`,
            `rgba(${Math.min(255, pr + 60)}, ${Math.min(255, pg + 60)}, ${Math.min(255, pb + 20)}, ${p.opacity * 0.8 * particleOp})`, 0.5);
          else drawShape(ctx, p,
            `rgba(${Math.min(255, pr + 110)}, ${Math.min(255, pg + 120)}, ${Math.min(255, pb + 20)}, ${p.opacity * 0.9 * particleOp})`,
            `rgba(${Math.min(255, pr + 180)}, ${Math.min(255, pg + 140)}, ${Math.min(255, pb + 20)}, ${p.opacity * particleOp})`, 0.8);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
      initDots();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Update refs
  useEffect(() => { lastPanelRef.current = { x: panelX, y: panelY, width: panelWidth, height: panelHeight }; }, [panelX, panelY, panelWidth, panelHeight]);
  useEffect(() => { pulsesRef.current = pulses; }, [pulses]);
  useEffect(() => { mousePosRef.current = mousePos; }, [mousePos]);
  useEffect(() => { panelsRef.current = panels; }, [panels]);
  useEffect(() => { connectionsRef.current = connections; }, [connections]);
  useEffect(() => { sliceTrailRef.current = sliceTrail; }, [sliceTrail]);
  useEffect(() => { cutConnectionsRef.current = cutConnections; }, [cutConnections]);
  useEffect(() => { onCutAnimationCompleteRef.current = onCutAnimationComplete; }, [onCutAnimationComplete]);
  useEffect(() => { configRef.current = config; }, [config]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
