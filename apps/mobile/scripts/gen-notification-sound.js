const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const duration = 0.4;
const numSamples = Math.floor(sampleRate * duration);

// Soft glass-tap: one clear note, smooth fade in and fade out (no punch, no pluck)
const freq = 880;
const amplitude = 9000;

const data = Buffer.alloc(numSamples * 2);
const riseTime = 0.05;
const fallStart = 0.08;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const rise = 1 - Math.exp(-t / riseTime);
  const fall = t <= fallStart ? 1 : Math.exp(-(t - fallStart) * 14);
  const env = Math.min(rise * fall, 1);
  const sample = amplitude * Math.sin(2 * Math.PI * freq * t) * env;
  data.writeInt16LE(
    Math.max(-32768, Math.min(32767, Math.round(sample))),
    i * 2
  );
}

const dataSize = data.length;
const byteRate = sampleRate * 2;
const blockAlign = 2;
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + dataSize, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(byteRate, 28);
header.writeUInt16LE(blockAlign, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(dataSize, 40);
const wav = Buffer.concat([header, data]);
const outDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'notification.wav');
fs.writeFileSync(outPath, wav);
console.log('Wrote', outPath, wav.length, 'bytes');
