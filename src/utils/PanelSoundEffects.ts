// ============================================================================
// PANEL SOUND EFFECTS - Web Audio API based sound system
// ============================================================================

class PanelSoundEffects {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();

      // Try to load sound file, fail silently if not available
      try {
        const response = await fetch('/hoverfx2.mp3');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }
      } catch {
        // Sound file not available - generate a simple click sound instead
        this.generateFallbackBuffer();
      }
    } catch (e) {
      console.warn('Failed to initialize sound:', e);
    }
  }

  private generateFallbackBuffer() {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const duration = 0.05;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 80);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    this.audioBuffer = buffer;
  }

  play(volume: number = 0.035, pitch: number = 0.8) {
    if (!this.audioContext || !this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    try {
      const ctx = this.audioContext;
      const now = ctx.currentTime;
      const duration = 0.06;

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = this.audioBuffer;
      source.playbackRate.value = pitch;
      gainNode.gain.setValueAtTime(volume, now);
      gainNode.gain.setValueAtTime(volume, now + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(now);
      source.stop(now + duration);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }

  playRandomized(baseVolume: number = 0.035, basePitch: number = 0.8, pitchVariation: number = 0.15) {
    const pitch = basePitch + (Math.random() - 0.5) * 2 * pitchVariation;
    const volume = baseVolume * (0.9 + Math.random() * 0.2);
    this.play(volume, pitch);
  }
}

export const panelSounds = new PanelSoundEffects();
