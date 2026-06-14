/*
 * Generates the game's sound effects as 16-bit mono WAV files.
 * No external assets — every sound is synthesized here, so it's
 * fully license-free. Run: `node scripts/gen-sounds.js`
 */
const fs = require('fs');
const path = require('path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), off);
    off += 2;
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', name, (n / SR).toFixed(2) + 's');
}

const ms = (m) => Math.round((SR * m) / 1000);
const silence = (m) => new Array(ms(m)).fill(0);

// A warm tone (sine + soft 2nd harmonic) with attack/release envelope.
function tone(freq, dur, opts = {}) {
  const { vol = 0.5, attack = 8, release = 70, vibrato = 0 } = opts;
  const n = ms(dur);
  const aN = ms(attack);
  const rN = ms(release);
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = freq * (1 + (vibrato ? 0.006 * Math.sin(2 * Math.PI * 6 * t) : 0));
    const ph = 2 * Math.PI * f * t;
    let w = 0.85 * Math.sin(ph) + 0.15 * Math.sin(2 * ph);
    let env = 1;
    if (i < aN) env = i / aN;
    else if (i > n - rN) env = Math.max(0, (n - i) / rN);
    out[i] = w * env * vol;
  }
  return out;
}

function mix(...arrs) {
  const n = Math.max(...arrs.map((a) => a.length));
  const out = new Array(n).fill(0);
  for (const a of arrs) for (let i = 0; i < a.length; i++) out[i] += a[i];
  return out;
}
const concat = (...arrs) => [].concat(...arrs);

// Notes (Hz)
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99,
      A5 = 880.0, C6 = 1046.5, E6 = 1318.5, G4 = 392.0, E4 = 329.63;

// correct: bright ascending major triad
const correct = concat(
  tone(C5, 90), tone(E5, 90), tone(G5, 180, { release: 130 })
);

// win: ascending run + shimmering high chord
const win = concat(
  tone(C5, 110), tone(E5, 110), tone(G5, 110),
  tone(C6, 260, { release: 200, vibrato: 1 }),
  silence(30),
  mix(
    tone(C6, 340, { vol: 0.32, release: 280, vibrato: 1 }),
    tone(E6, 340, { vol: 0.28, release: 280, vibrato: 1 })
  )
);

// wrong: soft, gentle two-note dip (never harsh)
const wrong = concat(
  tone(G4, 120, { vol: 0.38, release: 90 }),
  tone(E4, 170, { vol: 0.38, release: 130 })
);

// tap: tiny soft pop
const tap = tone(330, 70, { vol: 0.3, attack: 2, release: 58 });

// roll: dice rattle = low-passed noise with bumpy amplitude
function rollSound() {
  const dur = 680;
  const n = ms(dur);
  const out = new Array(n).fill(0);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const noise = Math.random() * 2 - 1;
    prev = prev * 0.6 + noise * 0.4; // soft low-pass
    const fade = i < n * 0.82 ? 1 : Math.max(0, (n - i) / (n * 0.18));
    let r = Math.abs(Math.sin(2 * Math.PI * 7 * t));
    r = r * r; // sharpen the rattle bumps
    out[i] = prev * r * fade * 0.5;
  }
  return out;
}

writeWav('correct.wav', correct);
writeWav('win.wav', win);
writeWav('wrong.wav', wrong);
writeWav('tap.wav', tap);
writeWav('roll.wav', rollSound());
console.log('done');
