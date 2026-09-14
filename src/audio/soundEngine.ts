// Web Audio API Procedural Sound Engine for Beach Kart Racing
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Engine sound nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineRunning: boolean = false;

  // Music state
  private musicInterval: any = null;
  private musicPlaying: boolean = false;
  private currentBeat: number = 0;

  public soundEnabled: boolean = true;
  public musicEnabled: boolean = true;
  public volume: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundEnabled ? 0.7 : 0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.35 : 0;
      this.musicGain.connect(this.masterGain);

      this.initEngine();
    } catch (e) {
      console.warn('AudioContext not supported or blocked', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.value = enabled ? 0.7 : 0;
    }
    if (this.engineGain) {
      this.engineGain.gain.value = enabled ? 0.15 : 0;
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.value = enabled ? 0.35 : 0;
    }
    if (enabled && !this.musicPlaying) {
      this.startMusic();
    } else if (!enabled && this.musicPlaying) {
      this.stopMusic();
    }
  }

  private initEngine() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';

    this.engineOsc1.frequency.value = 55;
    this.engineOsc2.frequency.value = 110;

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 400;

    this.engineGain.gain.value = 0; // starts muted

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineRunning = true;
  }

  public updateEnginePitch(speedKmH: number, isAccelerating: boolean, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;
    if (!this.soundEnabled) {
      this.engineGain.gain.value = 0;
      return;
    }

    const t = this.ctx.currentTime;
    const normSpeed = Math.min(Math.max(speedKmH / 160, 0), 1.2);
    
    // Base frequency 40Hz idle up to 190Hz top speed
    const targetFreq = 42 + (normSpeed * 130) + (isAccelerating ? 15 : 0) + (isBoosting ? 35 : 0);
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 2.01, t, 0.08);

    // Filter opens up as speed increases
    const filterFreq = 350 + (normSpeed * 1200) + (isBoosting ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);

    // Volume level
    const targetVol = 0.12 + normSpeed * 0.14 + (isBoosting ? 0.08 : 0);
    this.engineGain.gain.setTargetAtTime(targetVol, t, 0.05);
  }

  public startEngine() {
    if (this.engineGain && this.ctx && this.soundEnabled) {
      this.engineGain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.05);
    }
  }

  public updateEngine(speedKmH: number, isDrifting: boolean = false) {
    this.updateEnginePitch(speedKmH, speedKmH > 5, isDrifting);
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playSpin() {
    this.playCollision();
    this.playDriftScreech();
  }

  public playDriftScreech() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.7));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 4.0;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
    } catch (e) {}
  }

  public playBoost() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(3200, t + 0.4);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.6);
    } catch (e) {}
  }

  public playItemPickup() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const noteStart = t + idx * 0.05;
        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(noteStart);
        osc.stop(noteStart + 0.16);
      });
    } catch (e) {}
  }

  public playCountdown(isGo: boolean) {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = isGo ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t); // A5 or A4
      
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.35); // D6
      }

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + (isGo ? 0.65 : 0.26));
    } catch (e) {}
  }

  public playCollision() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  public playItemUse(type: string) {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      if (type === 'turbo') {
        this.playBoost();
      } else if (type === 'missile') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'shield') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.25);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
      } else {
        // trap / plop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    } catch (e) {}
  }

  public playSpinOut() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.linearRampToValueAtTime(150, t + 0.5);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  // Procedural tropical synth background music
  public startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    this.currentBeat = 0;

    // Upbeat tropical calypso melody chords: F, C, Dm, Bb
    const chords = [
      [349.23, 440.00, 523.25], // F major
      [261.63, 329.63, 392.00], // C major
      [293.66, 349.23, 440.00], // D minor
      [233.08, 293.66, 349.23], // Bb major
    ];

    const melodyNotes = [
      698.46, 659.25, 587.33, 523.25, 587.33, 659.25, 698.46, 783.99,
      880.00, 783.99, 698.46, 659.25, 587.33, 523.25, 659.25, 587.33
    ];

    const beatDuration = 180; // ms per 16th beat (approx 133 BPM)

    this.musicInterval = setInterval(() => {
      if (!this.musicPlaying || !this.musicEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step = this.currentBeat % 32;

      // Bass note on every 4 beats
      if (step % 4 === 0) {
        const chordIdx = Math.floor(step / 8) % chords.length;
        const bassFreq = chords[chordIdx][0] / 2;
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, t);
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain!);
        bassOsc.start(t);
        bassOsc.stop(t + 0.36);
      }

      // Marimba/Steel drum pluck on melody
      if (step % 2 === 0 && Math.random() > 0.15) {
        const note = melodyNotes[(step / 2) % melodyNotes.length];
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(note, t);
        mGain.gain.setValueAtTime(0.12, t);
        mGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        mOsc.connect(mGain);
        mGain.connect(this.musicGain!);
        mOsc.start(t);
        mOsc.stop(t + 0.18);
      }

      this.currentBeat++;
    }, beatDuration);
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
