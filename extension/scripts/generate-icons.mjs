// Simple icon generator: writes placeholder PNGs from embedded base64 into extension/icons
// These are transparent 1x1 PNGs used as placeholders to satisfy Chrome's icon file requirements.
// You can replace them later with branded assets without changing manifest.json.

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const OUTDIR = resolve(process.cwd(), 'icons')

// 1x1 transparent PNG (base64)
const TRANSPARENT_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA' +
  'AAC0lEQVR42mP8/xcAAwMB/ek1q4QAAAAASUVORK5CYII='

async function ensureDir(dir) {
  try { await mkdir(dir, { recursive: true }) } catch {}
}

async function writePng(path, b64) {
  const buf = Buffer.from(b64, 'base64')
  await writeFile(path, buf)
}

(async () => {
  const out = OUTDIR
  await ensureDir(out)
  await writePng(resolve(out, '16.png'), TRANSPARENT_1x1)
  await writePng(resolve(out, '48.png'), TRANSPARENT_1x1)
  await writePng(resolve(out, '128.png'), TRANSPARENT_1x1)
  console.log('Generated placeholder icons at', out)
})().catch(err => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})

