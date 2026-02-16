// ============================================================================
// GENERAL SOUND EFFECTS - Lightweight UI sound feedback
// ============================================================================

class SoundEffectsManager {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      } catch {
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.03) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Silently fail
    }
  }

  playClickSound() {
    this.playTone(800, 0.05, 0.04);
  }

  playHoverSound(_elementId?: string) {
    this.playTone(1200, 0.03, 0.015);
  }

  playQuickStartClick(volume: number = 0.04) {
    this.playTone(600, 0.06, volume);
  }
}

export const soundEffects = new SoundEffectsManager();
