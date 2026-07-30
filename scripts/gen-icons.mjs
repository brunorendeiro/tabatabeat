// One-off generator for PWA icons — no external image libs available in this environment,
// so we build minimal valid PNGs by hand (zlib deflate of raw RGBA scanlines). Shapes are
// drawn analytically (circles/rects/line-segments in a 0..100 coordinate space) with 4x4
// supersampling for anti-aliased edges, instead of a coarse blocky pixel grid.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeData), 0)
  return Buffer.concat([len, typeData, crc])
}

const BG = [255, 90, 54] // accent orange-red
const FACE = [245, 241, 236] // near-white watch face
const DARK = [18, 16, 14] // app background, used for hand/crown/pivot

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy)
}

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return dist(px, py, x1 + t * dx, y1 + t * dy)
}

function inRoundRect(x, y, rx, ry, rw, rh, radius) {
  const cx = Math.min(Math.max(x, rx + radius), rx + rw - radius)
  const cy = Math.min(Math.max(y, ry + radius), ry + rh - radius)
  if (x >= rx + radius && x <= rx + rw - radius) return y >= ry && y <= ry + rh
  if (y >= ry + radius && y <= ry + rh - radius) return x >= rx && x <= rx + rw
  return dist(x, y, cx, cy) <= radius
}

// Classic stopwatch silhouette: round face, top crown, one hand mid-sweep, center pivot.
function colorAt(x, y) {
  if (dist(x, y, 50, 50) <= 5.5) return DARK // center pivot
  if (segDist(x, y, 50, 50, 64, 26) <= 4.4) return DARK // hand
  if (inRoundRect(x, y, 44, 5, 12, 12, 4)) return DARK // crown
  if (dist(x, y, 50, 50) <= 37) return FACE // watch face
  return BG // background
}

function drawIcon(size) {
  const SS = 4
  const px = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = ((x + (sx + 0.5) / SS) / size) * 100
          const ny = ((y + (sy + 0.5) / SS) / size) * 100
          const [cr, cg, cb] = colorAt(nx, ny)
          r += cr; g += cg; b += cb
        }
      }
      const n = SS * SS
      const i = (y * size + x) * 4
      px[i] = Math.round(r / n); px[i + 1] = Math.round(g / n); px[i + 2] = Math.round(b / n); px[i + 3] = 255
    }
  }
  return px
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    Buffer.from(pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const idat = deflateSync(raw)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), encodePng(size, drawIcon(size)))
}

writeFileSync(new URL('../public/icon-64.png', import.meta.url), encodePng(64, drawIcon(64)))

console.log('Icons generated.')
