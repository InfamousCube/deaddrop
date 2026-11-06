// Audio: song decoding, 30-second previews with tape spin-up/spin-down, full playback with an
// accurate song clock, VU levels, and a small library of layered mechanical sound effects that are
// synthesised once at start (no sample files, no oscillator beeps).
import * as THREE from 'three';

const SR = 48000;

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.songs = new Map(); // id -> AudioBuffer
    this.sfx = {};
    this.preview = null;
    this.play = null;
    this.muted = false;
  }

  async init({ muted = false } = {}) {
    if (this.ctx) return;
    this.muted = muted;
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive', sampleRate: SR }));
    this.master = ctx.createGain();
    this.master.gain.value = muted ? 0 : 0.9;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 2; limiter.ratio.value = 12;
    limiter.attack.value = 0.002; limiter.release.value = 0.12;
    this.master.connect(limiter).connect(ctx.destination);

    // music bus with analysers (stereo split for VU, low band for speaker cones)
    this.music = ctx.createGain();
    this.music.connect(this.master);
    const split = ctx.createChannelSplitter(2);
    this.music.connect(split);
    this.anL = ctx.createAnalyser(); this.anR = ctx.createAnalyser();
    this.anL.fftSize = this.anR.fftSize = 1024;
    split.connect(this.anL, 0); split.connect(this.anR, 1);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 120;
    this.anLow = ctx.createAnalyser(); this.anLow.fftSize = 1024;
    this.music.connect(lp).connect(this.anLow);
    this._buf = new Float32Array(1024);
    this.levels = { l: 0, r: 0, low: 0, rms: 0 };

    // sfx bus -> small room reverb
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(1.4, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    this.sfxBus.connect(this.verb).connect(wet).connect(this.master);

    this.amb = ctx.createGain(); this.amb.gain.value = 0;
    this.amb.connect(this.master);

    await this._buildSfx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  unlock() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  async loadSong(id, url) {
    if (this.songs.has(id)) return this.songs.get(id);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`song ${id}: HTTP ${res.status}`);
    const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
    this.songs.set(id, buf);
    return buf;
  }

  // ---------------------------------------------------------------------------------------
  // Preview: loop [start,end] with tape spin-up; crossfaded seam.
  previewStart(id, start, end) {
    const buf = this.songs.get(id);
    if (!buf || !this.ctx) return;
    if (this.preview && this.preview.id === id && !this.preview.stopping) return;
    this.previewStop(true);
    const ctx = this.ctx;
    const out = ctx.createGain(); out.gain.value = 0;
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 900;
    tone.connect(out).connect(this.music);
    const t0 = ctx.currentTime + 0.02;
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.95, t0 + 0.35);
    tone.frequency.setValueAtTime(900, t0);
    tone.frequency.exponentialRampToValueAtTime(20000, t0 + 0.45);
    const p = { id, start, end, out, tone, srcs: [], stopping: false, startedAt: t0 };
    this.preview = p;
    this._previewSegment(p, t0, true);
    this.oneShot('tapeStart', null, 0.7);
  }

  _previewSegment(p, when, spinUp) {
    if (p.stopping || this.preview !== p) return;
    const ctx = this.ctx, buf = this.songs.get(p.id);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain();
    src.connect(g).connect(p.tone);
    const len = p.end - p.start, fade = 1.2;
    g.gain.setValueAtTime(spinUp ? 1 : 0, when);
    if (!spinUp) g.gain.linearRampToValueAtTime(1, when + fade);
    g.gain.setValueAtTime(1, when + len - fade);
    g.gain.linearRampToValueAtTime(0, when + len);
    if (spinUp) {
      src.playbackRate.setValueAtTime(0.32, when);
      src.playbackRate.exponentialRampToValueAtTime(1, when + 0.42);
    }
    src.start(when, p.start);
    src.stop(when + len + 0.05);
    p.srcs.push({ src, g });
    // schedule next loop (overlapping by the fade) a little ahead of time
    const next = when + len - fade;
    p.timer = setTimeout(() => this._previewSegment(p, next, false), Math.max(0, (next - ctx.currentTime - 0.5) * 1000));
  }

  previewStop(fast = false) {
    const p = this.preview;
    if (!p || p.stopping) return;
    p.stopping = true;
    clearTimeout(p.timer);
    const ctx = this.ctx, t = ctx.currentTime;
    const dur = fast ? 0.08 : 0.55;
    for (const { src } of p.srcs) {
      try {
        src.playbackRate.cancelScheduledValues(t);
        src.playbackRate.setValueAtTime(src.playbackRate.value, t);
        if (!fast) src.playbackRate.exponentialRampToValueAtTime(0.12, t + dur);
        src.stop(t + dur + 0.05);
      } catch { /* already stopped */ }
    }
    p.out.gain.cancelScheduledValues(t);
    p.out.gain.setValueAtTime(p.out.gain.value, t);
    p.out.gain.linearRampToValueAtTime(0, t + dur);
    p.tone.frequency.cancelScheduledValues(t);
    p.tone.frequency.setValueAtTime(p.tone.frequency.value, t);
    p.tone.frequency.exponentialRampToValueAtTime(700, t + dur);
    if (!fast) this.oneShot('tapeStop', null, 0.6);
    setTimeout(() => { try { p.out.disconnect(); } catch { /* */ } }, (dur + 0.2) * 1000);
    this.preview = null;
  }

  get previewing() { return !!(this.preview && !this.preview.stopping); }

  // ---------------------------------------------------------------------------------------
  // Full playback
  playSong(id, { offset = 0, delay = 0.05 } = {}) {
    this.stopSong(0.05);
    const ctx = this.ctx, buf = this.songs.get(id);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = 1;
    src.connect(g).connect(this.music);
    const when = ctx.currentTime + delay;
    src.start(when, offset);
    const p = { id, src, g, startAt: when - offset, duration: buf.duration, ended: false };
    src.onended = () => { p.ended = true; };
    this.play = p;
    return p;
  }

  stopSong(fade = 0.6) {
    const p = this.play;
    if (!p) return;
    const t = this.ctx.currentTime;
    p.g.gain.cancelScheduledValues(t);
    p.g.gain.setValueAtTime(p.g.gain.value, t);
    p.g.gain.linearRampToValueAtTime(0, t + fade);
    try { p.src.stop(t + fade + 0.02); } catch { /* */ }
    this.play = null;
  }

  // Song clock in seconds, corrected for output latency so visuals land with what you hear.
  songTime() {
    const p = this.play;
    if (!p) return -1;
    const lat = (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
    return this.ctx.currentTime - p.startAt - lat;
  }

  // ---------------------------------------------------------------------------------------
  update(dt, camera) {
    if (!this.ctx) return;
    // listener follows the head
    const l = this.ctx.listener;
    const m = camera.matrixWorld.elements;
    const px = m[12], py = m[13], pz = m[14];
    const fx = -m[8], fy = -m[9], fz = -m[10], ux = m[4], uy = m[5], uz = m[6];
    if (l.positionX) {
      const t = this.ctx.currentTime;
      l.positionX.setTargetAtTime(px, t, 0.02); l.positionY.setTargetAtTime(py, t, 0.02); l.positionZ.setTargetAtTime(pz, t, 0.02);
      l.forwardX.setTargetAtTime(fx, t, 0.02); l.forwardY.setTargetAtTime(fy, t, 0.02); l.forwardZ.setTargetAtTime(fz, t, 0.02);
      l.upX.setTargetAtTime(ux, t, 0.02); l.upY.setTargetAtTime(uy, t, 0.02); l.upZ.setTargetAtTime(uz, t, 0.02);
    } else if (l.setPosition) {
      l.setPosition(px, py, pz); l.setOrientation(fx, fy, fz, ux, uy, uz);
    }
    // levels with VU ballistics
    const rms = (an) => {
      an.getFloatTimeDomainData(this._buf);
      let s = 0; for (let i = 0; i < this._buf.length; i++) s += this._buf[i] * this._buf[i];
      return Math.sqrt(s / this._buf.length);
    };
    const L = rms(this.anL), R = rms(this.anR), Lo = rms(this.anLow);
    const k = (cur, tgt, up, down) => cur + (tgt - cur) * (1 - Math.exp(-dt * (tgt > cur ? up : down)));
    const lv = this.levels;
    lv.l = k(lv.l, Math.min(1, L * 3.2), 18, 5);
    lv.r = k(lv.r, Math.min(1, R * 3.2), 18, 5);
    lv.low = k(lv.low, Math.min(1, Lo * 4.5), 30, 9);
    lv.rms = (lv.l + lv.r) / 2;
  }

  // ---------------------------------------------------------------------------------------
  // SFX
  oneShot(name, pos = null, gain = 1, rate = 1) {
    if (!this.ctx || !this.sfx[name]) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.sfx[name];
    src.playbackRate.value = rate * (0.97 + Math.random() * 0.06);
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g);
    if (pos) {
      const pn = ctx.createPanner();
      pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 0.6; pn.rolloffFactor = 1.1;
      if (pn.positionX) { pn.positionX.value = pos.x; pn.positionY.value = pos.y; pn.positionZ.value = pos.z; } else pn.setPosition(pos.x, pos.y, pos.z);
      g.connect(pn).connect(this.sfxBus);
    } else g.connect(this.sfxBus);
    src.start();
    return src;
  }

  // Looping ambience beds
  startAmbience() {
    if (!this.ctx || this._ambSrc) return;
    const mk = (buf, gain) => {
      const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      const g = this.ctx.createGain(); g.gain.value = gain;
      s.connect(g).connect(this.amb); s.start();
      return s;
    };
    this._ambSrc = [mk(this.sfx.room, 0.5), mk(this.sfx.city, 0.35)];
  }

  ambience(level, time = 1.5) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.amb.gain.cancelScheduledValues(t);
    this.amb.gain.setValueAtTime(this.amb.gain.value, t);
    this.amb.gain.linearRampToValueAtTime(level, t + time);
  }

  _impulse(sec, decay) {
    const n = Math.floor(SR * sec);
    const b = this.ctx.createBuffer(2, n, SR);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        lp += ((Math.random() * 2 - 1) - lp) * 0.35;
        d[i] = lp * Math.pow(1 - i / n, decay) * (i < 200 ? i / 200 : 1);
      }
    }
    return b;
  }

  async _buildSfx() {
    const R = async (sec, fn, ch = 1) => {
      const oc = new OfflineAudioContext(ch, Math.ceil(SR * sec), SR);
      fn(oc, oc.destination);
      return oc.startRendering();
    };
    const noise = (oc, sec) => {
      const b = oc.createBuffer(1, Math.ceil(SR * sec), SR);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = oc.createBufferSource(); s.buffer = b; return s;
    };
    const brown = (oc, sec) => {
      const b = oc.createBuffer(1, Math.ceil(SR * sec), SR);
      const d = b.getChannelData(0);
      let v = 0;
      for (let i = 0; i < d.length; i++) { v = (v + (Math.random() * 2 - 1) * 0.02) * 0.998; d[i] = v * 3; }
      const s = oc.createBufferSource(); s.buffer = b; return s;
    };
    // envelope helper on a gain node
    const env = (oc, node, t, a, peak, d, sustain = 0) => {
      const g = oc.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(1e-4, sustain || 1e-4), t + a + d);
      node.connect(g);
      return g;
    };
    const click = (oc, out, t, f, q, peak, dec) => {
      const n = noise(oc, dec + 0.05);
      const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      n.connect(bp);
      env(oc, bp, t, 0.0008, peak, dec).connect(out);
      n.start(t);
    };
    const thump = (oc, out, t, f0, f1, peak, dec) => {
      const o = oc.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dec);
      env(oc, o, t, 0.002, peak, dec).connect(out);
      o.start(t); o.stop(t + dec + 0.05);
    };
    const metal = (oc, out, t, base, peak, dec) => {
      for (const [m, a] of [[1, 1], [2.76, 0.6], [5.4, 0.35], [8.93, 0.2]]) {
        const o = oc.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
        env(oc, o, t, 0.001, peak * a, dec / Math.sqrt(m)).connect(out);
        o.start(t); o.stop(t + dec + 0.05);
      }
    };
    const S = this.sfx;
    S.tick = await R(0.06, (oc, out) => { click(oc, out, 0, 4200, 3, 0.35, 0.012); metal(oc, out, 0, 2100, 0.05, 0.03); });
    S.dtmf = await R(0.22, (oc, out) => {
      click(oc, out, 0, 3100, 2.2, 0.55, 0.012);
      for (const f of [697, 1209]) {
        const o = oc.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        env(oc, o, 0.004, 0.006, 0.16, 0.14).connect(out);
        o.start(0.004); o.stop(0.18);
      }
      click(oc, out, 0.15, 2200, 2.0, 0.25, 0.01);
    });
    S.morse = await R(0.24, (oc, out) => {
      click(oc, out, 0, 3600, 2.5, 0.65, 0.01); metal(oc, out, 0, 1450, 0.06, 0.04);
      const o = oc.createOscillator(); o.type = 'sine'; o.frequency.value = 780;
      const o2 = oc.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 1560;
      env(oc, o, 0.003, 0.004, 0.22, 0.15).connect(out);
      env(oc, o2, 0.003, 0.004, 0.04, 0.12).connect(out);
      o.start(0.003); o.stop(0.19); o2.start(0.003); o2.stop(0.19);
      click(oc, out, 0.16, 2600, 2.2, 0.35, 0.01);
    });
    S.ping = await R(1.1, (oc, out) => {
      click(oc, out, 0, 2800, 2.0, 0.5, 0.012);
      for (const [f, a, d] of [[1320, 0.28, 0.85], [2640, 0.09, 0.45], [1980, 0.05, 0.35]]) {
        const o = oc.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.01, 0.01); o.frequency.exponentialRampToValueAtTime(f, 0.06);
        env(oc, o, 0.01, 0.005, a, d).connect(out);
        o.start(0.01); o.stop(0.02 + d);
      }
    });
    S.pneumatic = await R(0.65, (oc, out) => {
      click(oc, out, 0, 2100, 1.5, 0.75, 0.018); thump(oc, out, 0.003, 150, 65, 0.8, 0.09);
      const n = noise(oc, 0.55); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.8;
      bp.frequency.setValueAtTime(3400, 0.01); bp.frequency.exponentialRampToValueAtTime(1100, 0.45);
      n.connect(bp); env(oc, bp, 0.01, 0.015, 0.38, 0.44).connect(out); n.start(0.01);
      metal(oc, out, 0.08, 880, 0.08, 0.25);
    });
    S.grab = await R(0.2, (oc, out) => { click(oc, out, 0, 1800, 1.4, 0.7, 0.02); click(oc, out, 0.018, 2600, 2, 0.45, 0.015); thump(oc, out, 0, 220, 120, 0.5, 0.06); });
    S.drop = await R(0.25, (oc, out) => { click(oc, out, 0, 1500, 1.2, 0.6, 0.025); thump(oc, out, 0, 160, 80, 0.55, 0.09); click(oc, out, 0.05, 2400, 2, 0.2, 0.015); });
    S.whoosh = await R(0.45, (oc, out) => {
      const n = noise(oc, 0.45); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(380, 0); bp.frequency.exponentialRampToValueAtTime(2200, 0.32);
      n.connect(bp); const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.5, 0.16); g.gain.exponentialRampToValueAtTime(0.001, 0.42);
      bp.connect(g).connect(out); n.start(0);
    });
    S.key = await R(0.4, (oc, out) => {
      click(oc, out, 0, 2400, 1.6, 0.8, 0.012); thump(oc, out, 0.004, 140, 70, 0.9, 0.08);
      metal(oc, out, 0.003, 1180, 0.09, 0.22); click(oc, out, 0.045, 1200, 1.2, 0.35, 0.02); thump(oc, out, 0.05, 95, 60, 0.4, 0.07);
    });
    S.keyUp = await R(0.2, (oc, out) => { click(oc, out, 0, 2000, 1.6, 0.4, 0.01); thump(oc, out, 0, 180, 110, 0.25, 0.04); });
    S.slot = await R(0.6, (oc, out) => {
      click(oc, out, 0, 1700, 1.3, 0.8, 0.02); thump(oc, out, 0.002, 120, 60, 0.9, 0.1);
      for (let i = 0; i < 3; i++) click(oc, out, 0.06 + i * 0.035, 2800 + i * 300, 3, 0.25 - i * 0.05, 0.01);
      metal(oc, out, 0.01, 760, 0.06, 0.3);
    });
    S.lid = await R(0.7, (oc, out) => {
      const n = noise(oc, 0.3); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
      n.connect(bp); const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.12, 0.12); g.gain.linearRampToValueAtTime(0, 0.24);
      bp.connect(g).connect(out); n.start(0);
      click(oc, out, 0.24, 1900, 1.4, 0.8, 0.02); thump(oc, out, 0.245, 110, 55, 1, 0.12); metal(oc, out, 0.25, 640, 0.07, 0.35);
      click(oc, out, 0.33, 3400, 4, 0.3, 0.01);
    });
    S.lidOpen = await R(0.6, (oc, out) => {
      click(oc, out, 0, 3200, 3, 0.5, 0.01); thump(oc, out, 0.01, 200, 120, 0.4, 0.05);
      const o = oc.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(240, 0.02); o.frequency.exponentialRampToValueAtTime(420, 0.3);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp);
      env(oc, lp, 0.02, 0.02, 0.06, 0.4).connect(out); o.start(0.02); o.stop(0.5);
    });
    S.motor = await R(1.4, (oc, out) => {
      const o = oc.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(40, 0); o.frequency.linearRampToValueAtTime(62, 0.5);
      const lfo = oc.createOscillator(); lfo.frequency.value = 11; const lg = oc.createGain(); lg.gain.value = 3; lfo.connect(lg).connect(o.frequency);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; o.connect(lp);
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.18, 0.2); g.gain.setValueAtTime(0.18, 1.0); g.gain.linearRampToValueAtTime(0, 1.35);
      lp.connect(g).connect(out); o.start(0); lfo.start(0); o.stop(1.4); lfo.stop(1.4);
      const n = noise(oc, 1.4); const hp = oc.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 3200; hp.Q.value = 0.7; n.connect(hp);
      const g2 = oc.createGain(); g2.gain.setValueAtTime(0, 0); g2.gain.linearRampToValueAtTime(0.03, 0.3); g2.gain.linearRampToValueAtTime(0, 1.35); hp.connect(g2).connect(out); n.start(0);
    });
    S.tapeStart = await R(0.5, (oc, out) => {
      click(oc, out, 0, 2200, 2, 0.4, 0.012);
      const o = oc.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(25, 0); o.frequency.exponentialRampToValueAtTime(70, 0.35);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; o.connect(lp);
      env(oc, lp, 0.005, 0.05, 0.1, 0.4).connect(out); o.start(0); o.stop(0.5);
    });
    S.tapeStop = await R(0.6, (oc, out) => {
      const o = oc.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, 0); o.frequency.exponentialRampToValueAtTime(20, 0.45);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280; o.connect(lp);
      env(oc, lp, 0.005, 0.02, 0.08, 0.5).connect(out); o.start(0); o.stop(0.6);
      click(oc, out, 0.47, 1900, 2, 0.3, 0.012);
    });
    S.switch = await R(0.5, (oc, out) => {
      click(oc, out, 0, 3000, 2.5, 0.9, 0.008); click(oc, out, 0.006, 1300, 1.5, 0.6, 0.02); thump(oc, out, 0.004, 160, 80, 0.5, 0.05);
      // filament swell
      const n = noise(oc, 0.5); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 120; bp.Q.value = 6; n.connect(bp);
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0.02); g.gain.linearRampToValueAtTime(0.25, 0.08); g.gain.exponentialRampToValueAtTime(0.001, 0.45); bp.connect(g).connect(out); n.start(0);
    });
    S.shutter = await R(2.2, (oc, out) => {
      const n = brown(oc, 2.2); const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; n.connect(lp);
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.5, 0.25); g.gain.setValueAtTime(0.5, 1.7); g.gain.linearRampToValueAtTime(0, 2.1);
      lp.connect(g).connect(out); n.start(0);
      for (let t = 0.1; t < 1.9; t += 0.085) click(oc, out, t, 1500 + Math.random() * 900, 3, 0.12 + Math.random() * 0.06, 0.01);
      thump(oc, out, 1.95, 120, 60, 0.6, 0.12); click(oc, out, 1.95, 1500, 1.4, 0.4, 0.02);
    });
    S.hatch = await R(1.2, (oc, out) => {
      const n = noise(oc, 1.0); const bp = oc.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2500; n.connect(bp);
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.12, 0.05); g.gain.exponentialRampToValueAtTime(0.002, 0.7); bp.connect(g).connect(out); n.start(0);
      thump(oc, out, 0.72, 120, 55, 0.8, 0.14); click(oc, out, 0.72, 1300, 1.2, 0.5, 0.02); metal(oc, out, 0.73, 520, 0.05, 0.4);
    });
    S.crack = await R(1.6, (oc, out) => {
      click(oc, out, 0, 900, 0.6, 1, 0.05); thump(oc, out, 0, 90, 35, 1, 0.3);
      for (let i = 0; i < 26; i++) {
        const t = 0.05 + Math.random() * 1.2;
        const o = oc.createOscillator(); o.type = 'sine'; o.frequency.value = 2400 + Math.random() * 4200;
        env(oc, o, t, 0.001, 0.05 + Math.random() * 0.06, 0.08 + Math.random() * 0.12).connect(out);
        o.start(t); o.stop(t + 0.3);
      }
      const n = noise(oc, 1.5); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5; n.connect(bp);
      const g = oc.createGain(); g.gain.setValueAtTime(0.4, 0); g.gain.exponentialRampToValueAtTime(0.001, 1.4); bp.connect(g).connect(out); n.start(0);
    });
    S.rebuild = await R(2.4, (oc, out) => {
      const n = noise(oc, 2.4); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1;
      bp.frequency.setValueAtTime(2600, 0); bp.frequency.exponentialRampToValueAtTime(300, 1.9); n.connect(bp);
      const g = oc.createGain(); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(0.4, 1.4); g.gain.linearRampToValueAtTime(0, 2.0); bp.connect(g).connect(out); n.start(0);
      for (let i = 0; i < 14; i++) click(oc, out, 1.3 + i * 0.045 + Math.random() * 0.02, 1400 + Math.random() * 1600, 2, 0.25, 0.012);
      thump(oc, out, 2.0, 110, 50, 1, 0.2);
    });
    S.room = await R(6, (oc, out) => {
      const n = brown(oc, 6); const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; n.connect(lp);
      const g = oc.createGain(); g.gain.value = 0.35; lp.connect(g).connect(out); n.start(0);
      const o = oc.createOscillator(); o.frequency.value = 60; const g2 = oc.createGain(); g2.gain.value = 0.004; o.connect(g2).connect(out); o.start(0);
    });
    S.city = await R(8, (oc, out) => {
      const n = noise(oc, 8); const bp = oc.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.4; n.connect(bp);
      const g = oc.createGain(); g.gain.value = 0.02; bp.connect(g).connect(out); n.start(0);
      const lfo = oc.createOscillator(); lfo.frequency.value = 0.18; const lg = oc.createGain(); lg.gain.value = 0.008; lfo.connect(lg).connect(g.gain); lfo.start(0);
    });
    // make loops seamless: crossfade tails into heads
    for (const k of ['room', 'city']) {
      const d = S[k].getChannelData(0), n = d.length, f = Math.floor(SR * 0.5);
      for (let i = 0; i < f; i++) { const a = i / f; d[i] = d[i] * a + d[n - f + i] * (1 - a); }
      const trimmed = this.ctx.createBuffer(1, n - f, SR); trimmed.copyToChannel(d.subarray(0, n - f), 0); S[k] = trimmed;
    }
  }
}

// little helper for haptics on XR gamepads
export function pulse(inputSource, intensity = 0.5, ms = 30) {
  const h = inputSource?.gamepad?.hapticActuators?.[0];
  if (h?.pulse) h.pulse(intensity, ms).catch?.(() => {});
}

export { THREE };
