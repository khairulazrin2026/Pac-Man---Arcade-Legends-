/**
 * Authentic Web Audio API Synthesizer for Pac-Man Arcade
 * No external audio files needed - 100% synthesized in real time!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Background sirens
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;

  private frightenedOsc: OscillatorNode | null = null;
  private frightenedGain: GainNode | null = null;

  private eyesOsc: OscillatorNode | null = null;
  private eyesGain: GainNode | null = null;

  private lastWakaTime: number = 0;

  constructor() {
    const savedMute = localStorage.getItem('pacman_muted');
    this.isMuted = savedMute === 'true';
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('pacman_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopAllLoops();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('pacman_muted', String(this.isMuted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.25, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopAllLoops();
    }
  }

  /**
   * Classic alternating Pac-Man Waka-Waka
   */
  public playWaka(tone: 0 | 1 = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    if (now - this.lastWakaTime < 0.08) return; // Prevent audio stack overflow
    this.lastWakaTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';

    const startFreq = tone === 0 ? 340 : 490;
    const endFreq = tone === 0 ? 200 : 280;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Iconic Pac-Man Game Start Intro Jingle
   */
  public playIntro(): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    this.initContext();
    if (!this.ctx || !this.masterGain) return Promise.resolve();

    const now = this.ctx.currentTime;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Classic Pac-Man intro notes: [frequency, duration in seconds]
    // B4, B5, F#5, D#5, B5, F#5, D#5, C5, C6, G5, E5, C6, G5, E5,
    // B4, B5, F#5, D#5, B5, F#5, D#5, D#5, E5, F5, F5, F#5, G5, G#5, A5, B5
    const notes: [number, number][] = [
      [493.88, 0.14], [987.77, 0.14], [739.99, 0.14], [622.25, 0.14],
      [987.77, 0.09], [739.99, 0.14], [622.25, 0.22],
      [523.25, 0.14], [1046.50, 0.14], [783.99, 0.14], [659.25, 0.14],
      [1046.50, 0.09], [783.99, 0.14], [659.25, 0.22],
      [493.88, 0.14], [987.77, 0.14], [739.99, 0.14], [622.25, 0.14],
      [987.77, 0.09], [739.99, 0.14], [622.25, 0.22],
      [622.25, 0.07], [659.25, 0.07], [698.46, 0.07],
      [698.46, 0.07], [739.99, 0.07], [783.99, 0.07],
      [830.61, 0.07], [880.00, 0.07], [987.77, 0.28],
    ];

    let offset = 0;
    notes.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset + dur * 0.85);
      gain.gain.linearRampToValueAtTime(0.01, now + offset + dur);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + offset);
      osc.stop(now + offset + dur);

      offset += dur + 0.01;
    });

    return new Promise((resolve) => setTimeout(resolve, offset * 1000));
  }

  /**
   * Background Siren - undulating low/mid drone
   */
  public startSiren(intensity: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.sirenOsc) return; // Already playing

    const now = this.ctx.currentTime;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();
    this.sirenLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    const baseFreq = 220 + intensity * 60;
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.setValueAtTime(baseFreq, now);

    // LFO frequency modulation
    this.sirenLfo.type = 'sawtooth';
    this.sirenLfo.frequency.setValueAtTime(2 + intensity * 0.8, now);
    lfoGain.gain.setValueAtTime(45 + intensity * 25, now);

    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenGain.gain.setValueAtTime(0.08, now);

    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    this.sirenOsc.start(now);
    this.sirenLfo.start(now);
  }

  public stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenLfo?.stop();
        this.sirenOsc.disconnect();
        this.sirenLfo?.disconnect();
        this.sirenGain?.disconnect();
      } catch {}
      this.sirenOsc = null;
      this.sirenLfo = null;
      this.sirenGain = null;
    }
  }

  /**
   * Frightened Ghosts Siren (High-pitched warning oscillation)
   */
  public startFrightenedSiren() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stopSiren();
    if (this.frightenedOsc) return;

    const now = this.ctx.currentTime;
    this.frightenedOsc = this.ctx.createOscillator();
    this.frightenedGain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    this.frightenedOsc.type = 'sawtooth';
    this.frightenedOsc.frequency.setValueAtTime(480, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, now);
    lfoGain.gain.setValueAtTime(90, now);

    lfo.connect(lfoGain);
    lfoGain.connect(this.frightenedOsc.frequency);

    this.frightenedGain.gain.setValueAtTime(0.12, now);

    this.frightenedOsc.connect(this.frightenedGain);
    this.frightenedGain.connect(this.masterGain);

    this.frightenedOsc.start(now);
    lfo.start(now);
  }

  public stopFrightenedSiren() {
    if (this.frightenedOsc) {
      try {
        this.frightenedOsc.stop();
        this.frightenedOsc.disconnect();
        this.frightenedGain?.disconnect();
      } catch {}
      this.frightenedOsc = null;
      this.frightenedGain = null;
    }
  }

  /**
   * Eaten Ghost (Score Chime)
   */
  public playEatGhost(comboIndex: number = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Pitches increase with consecutive ghost combos: 200, 400, 800, 1600
    const pitches = [550, 720, 950, 1250];
    const base = pitches[Math.min(comboIndex, pitches.length - 1)];

    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Eat Fruit Bonus Chime
   */
  public playEatFruit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [659, 784, 988, 1318];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.25, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }

  /**
   * Classic Pac-Man Death Sound - Descending Chromatic Staccato & Pop
   */
  public playDeath(): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    this.initContext();
    if (!this.ctx || !this.masterGain) return Promise.resolve();

    this.stopAllLoops();
    const now = this.ctx.currentTime;
    const ctx = this.ctx;
    const master = this.masterGain;

    // Series of quick descending pitches
    const freqs = [
      880, 830, 784, 740, 698, 659, 622, 587, 554, 523, 493, 466, 440,
      415, 392, 370, 349, 330, 311, 293, 277, 261, 246, 233, 220
    ];

    let delay = 0;
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + delay);

      gain.gain.setValueAtTime(0.28, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.055);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now + delay);
      osc.stop(now + delay + 0.06);

      delay += 0.055;
    });

    // Final "pop" / "bwoop" sound at the end
    const finalOsc = ctx.createOscillator();
    const finalGain = ctx.createGain();
    finalOsc.type = 'sine';
    finalOsc.frequency.setValueAtTime(140, now + delay);
    finalOsc.frequency.exponentialRampToValueAtTime(50, now + delay + 0.15);
    finalGain.gain.setValueAtTime(0.4, now + delay);
    finalGain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.18);

    finalOsc.connect(finalGain);
    finalGain.connect(master);

    finalOsc.start(now + delay);
    finalOsc.stop(now + delay + 0.18);

    return new Promise((resolve) => setTimeout(resolve, (delay + 0.25) * 1000));
  }

  /**
   * Extra Life Chime (1UP)
   */
  public playExtraLife() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.25, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.15);
    });
  }

  /**
   * Stop all continuous sound loops
   */
  public stopAllLoops() {
    this.stopSiren();
    this.stopFrightenedSiren();
    if (this.eyesOsc) {
      try {
        this.eyesOsc.stop();
        this.eyesOsc.disconnect();
        this.eyesGain?.disconnect();
      } catch {}
      this.eyesOsc = null;
      this.eyesGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
