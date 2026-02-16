// ============================================================================
// ░░ DITHER / ASCII EFFECTS TOOL ░░
// Full-featured image effects editor ported from codepen.io/sabosugi/pen/bNegbmy
// Supports 20+ algorithm modes, 20+ shape geometries, video input, and export.
// ============================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ToolComponentProps } from '@/components/grid/ToolPanel';
import { renderDither, DEFAULT_PARAMS, MODE_OPTIONS, SHAPE_OPTIONS } from './dither/renderEngine';
import type { DitherParams } from './dither/renderEngine';

type MediaType = 'none' | 'image' | 'video';

export default function DitherTool({ width, height }: ToolComponentProps) {
  const [params, setParams] = useState<DitherParams>(DEFAULT_PARAMS);
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>(0);

  const update = useCallback((key: keyof DitherParams, value: unknown) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  // ░░ Render ░░
  const render = useCallback(() => {
    if (!canvasRef.current) return;
    if (mediaType === 'image' && sourceImageRef.current) {
      renderDither(canvasRef.current, sourceImageRef.current, params);
    } else if (mediaType === 'video' && sourceVideoRef.current && !sourceVideoRef.current.paused) {
      renderDither(canvasRef.current, sourceVideoRef.current, params);
    }
  }, [params, mediaType]);

  // Re-render on param changes (for images)
  useEffect(() => {
    if (mediaType === 'image') render();
  }, [params, mediaType, render]);

  // Video loop
  useEffect(() => {
    if (mediaType !== 'video') return;
    let running = true;
    const loop = () => {
      if (!running) return;
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [mediaType, render]);

  // ░░ Load Image ░░
  const loadImage = useCallback((src: string) => {
    // Clean up video if switching
    if (sourceVideoRef.current) {
      sourceVideoRef.current.pause();
      sourceVideoRef.current.src = '';
      sourceVideoRef.current = null;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;
      setMediaType('image');
    };
    img.src = src;
  }, []);

  // ░░ Load Video ░░
  const loadVideo = useCallback((src: string) => {
    sourceImageRef.current = null;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      sourceVideoRef.current = video;
      setMediaType('video');
      video.play();
    };
    video.src = src;
  }, []);

  // ░░ File Upload ░░
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (file.type.startsWith('video/')) {
        loadVideo(result);
      } else {
        loadImage(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [loadImage, loadVideo]);

  // Load default image
  useEffect(() => {
    loadImage('https://ik.imagekit.io/sqiqig7tz/woman.jpg');
  }, [loadImage]);

  // ░░ Video Recording State ░░
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // ░░ Export Image ░░
  const exportImage = useCallback(() => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = `dither-ascii-${Date.now()}.png`;
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  }, []);

  // ░░ Export Video (Start/Stop Recording) ░░
  const toggleVideoRecording = useCallback(() => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const a = document.createElement('a');
      a.download = `dither-ascii-${Date.now()}.webm`;
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
      recorderRef.current = null;
    };
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [isRecording]);

  // ░░ Export Full Video (process entire video from start to end) ░░
  const [isExportingFull, setIsExportingFull] = useState(false);
  const exportFullVideo = useCallback(() => {
    if (!canvasRef.current || !sourceVideoRef.current || mediaType !== 'video') return;
    const video = sourceVideoRef.current;
    const canvas = canvasRef.current;

    // Seek to start
    video.currentTime = 0;
    video.play();
    setIsExportingFull(true);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const a = document.createElement('a');
      a.download = `dither-full-${Date.now()}.webm`;
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
      setIsExportingFull(false);
    };
    recorder.start();

    // Stop when video ends
    const onEnded = () => {
      recorder.stop();
      video.removeEventListener('ended', onEnded);
      video.loop = true; // restore loop
    };
    video.loop = false; // disable loop for full export
    video.addEventListener('ended', onEnded);
  }, [mediaType]);

  // Clean up recorder on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    };
  }, []);

  // ░░ Add to Canvas ░░
  const addToCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    window.dispatchEvent(new CustomEvent('dither-add-to-canvas', { detail: dataUrl }));
  }, []);

  // ░░ Styles ░░
  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: 'var(--gp-text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 2,
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', fontSize: 11, padding: '4px 6px',
    background: 'var(--gp-surface-deep)', border: '1px solid var(--gp-border)',
    borderRadius: 'var(--gp-radius-sm, 4px)', color: 'var(--gp-text)', outline: 'none',
  };
  const btnStyle: React.CSSProperties = {
    padding: '5px 10px', fontSize: 11, borderRadius: 'var(--gp-radius-sm, 6px)',
    border: '1px solid var(--gp-border)', background: 'var(--gp-surface)',
    color: 'var(--gp-text)', cursor: 'pointer', whiteSpace: 'nowrap',
  };

  const sliderRow = (label: string, value: number, min: number, max: number, step: number, key: keyof DitherParams) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--gp-text-dim)', fontFamily: 'var(--gp-font-mono, monospace)' }}>
          {Number.isInteger(value) ? value : value.toFixed(2)}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => update(key, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--gp-accent)' }}
      />
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      overflow: 'hidden', color: 'var(--gp-text)',
      background: 'var(--gp-panel-bg)',
    }}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* ░░ Preview Area ░░ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minWidth: 0, position: 'relative',
        background: 'var(--gp-surface-deep)',
      }}>
        {mediaType === 'none' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '80%', height: '70%',
              border: '2px dashed var(--gp-border)',
              borderRadius: 'var(--gp-radius-md, 8px)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', color: 'var(--gp-text-muted)',
            }}
          >
            <span style={{ fontSize: 28 }}>🖼</span>
            <span style={{ fontSize: 12 }}>Click to upload image or video</span>
            <span style={{ fontSize: 10, color: 'var(--gp-text-dim)' }}>Supports images & video files</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%', maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        )}

        {/* ░░ Action Buttons ░░ */}
        {mediaType !== 'none' && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, right: 8,
            display: 'flex', gap: 6, justifyContent: 'center',
          }}>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>📂 Upload</button>
            <button onClick={exportImage} style={btnStyle}>💾 Image</button>
            <button onClick={toggleVideoRecording} style={{
              ...btnStyle,
              ...(isRecording ? { borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239,68,68,0.1)' } : {}),
            }}>
              {isRecording ? '⏹ Stop Rec' : '🎬 Record'}
            </button>
            {mediaType === 'video' && (
              <button onClick={exportFullVideo} style={{
                ...btnStyle,
                ...(isExportingFull ? { borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245,158,11,0.1)' } : {}),
              }}>
                {isExportingFull ? '⏳ Exporting...' : '📼 Full Video'}
              </button>
            )}
            <button onClick={addToCanvas} style={{ ...btnStyle, borderColor: 'var(--gp-accent)', color: 'var(--gp-accent)' }}>➕ Add to Canvas</button>
          </div>
        )}
      </div>

      {/* ░░ Controls Sidebar ░░ */}
      <div style={{
        width: Math.min(220, width * 0.4), overflowY: 'auto', overflowX: 'hidden',
        padding: 10, display: 'flex', flexDirection: 'column', gap: 10,
        borderLeft: '1px solid var(--gp-border)',
        background: 'var(--gp-panel-bg)',
      }} className="scrollbar-none">

        {/* Algorithm Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={labelStyle}>Algorithm Mode</span>
          <select value={params.mode} onChange={(e) => update('mode', e.target.value)} style={selectStyle}>
            {Object.entries(MODE_OPTIONS).map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Shape */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={labelStyle}>Shape</span>
          <select value={params.shape} onChange={(e) => update('shape', e.target.value)} style={selectStyle}>
            {Object.entries(SHAPE_OPTIONS).map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Grid & Color */}
        {sliderRow('Cell Size', params.cellSize, 4, 40, 1, 'cellSize')}
        {sliderRow('Gap', params.gap, 0, 20, 0.25, 'gap')}
        {sliderRow('Scale Factor', params.baseScale, 0.1, 3.0, 0.025, 'baseScale')}
        {sliderRow('Effect Power', params.intensity, 0, 5.0, 0.05, 'intensity')}
        {sliderRow('Contrast', params.contrast, -100, 100, 1, 'contrast')}

        {/* Color Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={labelStyle}>Background</span>
          <input type="color" value={params.bgColor}
            onChange={(e) => update('bgColor', e.target.value)}
            style={{ width: 36, height: 24, border: 'none', cursor: 'pointer', borderRadius: 'var(--gp-radius-sm, 4px)' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={labelStyle}>Original Color</span>
          <input type="checkbox" checked={params.useColor} onChange={(e) => update('useColor', e.target.checked)} />
        </div>

        {!params.useColor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={labelStyle}>Foreground Color</span>
            <input type="color" value={params.monoColor}
              onChange={(e) => update('monoColor', e.target.value)}
              style={{ width: 36, height: 24, border: 'none', cursor: 'pointer', borderRadius: 'var(--gp-radius-sm, 4px)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
