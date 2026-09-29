/* Som ambiente gerado na hora (Web Audio): um acorde grave e lento com filtro
   respirando, mais um "vento" de ruído filtrado. Nada de arquivo de áudio.
   Começa desligado; o navegador só deixa tocar depois de um clique. */
export class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  on = false;

  private build() {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.6;
    lp.connect(master);
    const lfo = ctx.createOscillator(); const lfoG = ctx.createGain();
    lfo.frequency.value = 0.05; lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();

    // Lá menor com nona, bem espalhado
    [110, 164.81, 220.5, 246.94, 329.63].forEach((hz, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = hz;
      o.detune.value = (i - 2) * 4;
      const g = ctx.createGain(); g.gain.value = 0.16 / (i + 1);
      const trem = ctx.createOscillator(); const tg = ctx.createGain();
      trem.frequency.value = 0.07 + i * 0.03; tg.gain.value = g.gain.value * 0.5;
      trem.connect(tg); tg.connect(g.gain); trem.start();
      o.connect(g); g.connect(lp); o.start();
    });

    // vento
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.8;
    const wg = ctx.createGain(); wg.gain.value = 0.035;
    src.connect(bp); bp.connect(wg); wg.connect(master); src.start();

    this.ctx = ctx; this.master = master;
  }

  toggle(v = !this.on) {
    if (v && !this.ctx) this.build();
    if (!this.ctx || !this.master) return this.on;
    this.on = v;
    if (v) this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(v ? 0.22 : 0, t, v ? 1.2 : 0.3);
    return this.on;
  }

  /** desliga de vez e libera o áudio (troca de página, recarga do código) */
  destroy() {
    this.on = false;
    try { this.ctx?.close(); } catch {}
    this.ctx = null; this.master = null;
  }

  /** estalo curto para hover/clique, só quando o som está ligado */
  tick(freq = 1200) {
    if (!this.on || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + 0.14);
  }
}

// Um só som ambiente por página: se o site remontar (recarga do código),
// o anterior é desligado em vez de continuar tocando sozinho.
export function ambient(): Ambient {
  const w = window as any;
  if (!w.__tfAmbient) w.__tfAmbient = new Ambient();
  return w.__tfAmbient;
}
export function resetAmbient() {
  const w = window as any;
  w.__tfAmbient?.destroy();
  w.__tfAmbient = null;
}
