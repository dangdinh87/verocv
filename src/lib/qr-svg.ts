/*
  Zero-dependency QR Code generator (ISO/IEC 18004, Byte Mode, EC Level L, Versions 1..6).
  Generates crisp vector SVG matrices for CV profile links and VietQR fallback rendering.
*/

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function rsGeneratorPoly(ecLen: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < ecLen; i++) {
    const next = new Uint8Array(poly.length + 1)
    const factor = GF_EXP[i]
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], factor)
    }
    poly = next
  }
  return poly
}

function rsComputeEc(data: Uint8Array, ecLen: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLen)
  const res = new Uint8Array(ecLen)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0]
    res.copyWithin(0, 1)
    res[ecLen - 1] = 0
    for (let j = 0; j < ecLen; j++) {
      res[j] ^= gfMul(gen[j + 1], factor)
    }
  }
  return res
}

type VersionSpec = {
  version: number
  dataCapBytes: number
  totalDataCodewords: number
  ecPerBlock: number
  blocks: number
  alignCenters: number[]
}

const VERSIONS: VersionSpec[] = [
  { version: 1, dataCapBytes: 17, totalDataCodewords: 19, ecPerBlock: 7, blocks: 1, alignCenters: [] },
  { version: 2, dataCapBytes: 32, totalDataCodewords: 34, ecPerBlock: 10, blocks: 1, alignCenters: [6, 18] },
  { version: 3, dataCapBytes: 53, totalDataCodewords: 55, ecPerBlock: 15, blocks: 1, alignCenters: [6, 22] },
  { version: 4, dataCapBytes: 78, totalDataCodewords: 80, ecPerBlock: 20, blocks: 1, alignCenters: [6, 26] },
  { version: 5, dataCapBytes: 106, totalDataCodewords: 108, ecPerBlock: 26, blocks: 1, alignCenters: [6, 30] },
  { version: 6, dataCapBytes: 134, totalDataCodewords: 136, ecPerBlock: 18, blocks: 2, alignCenters: [6, 34] },
]

function encodeDataCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const bits: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }

  pushBits(0b0100, 4)
  pushBits(bytes.length, 8)
  for (const b of bytes) pushBits(b, 8)

  const maxBits = spec.totalDataCodewords * 8
  const term = Math.min(4, maxBits - bits.length)
  for (let i = 0; i < term; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords = new Uint8Array(spec.totalDataCodewords)
  for (let i = 0; i < bits.length / 8; i++) {
    let val = 0
    for (let b = 0; b < 8; b++) val = (val << 1) | bits[i * 8 + b]
    codewords[i] = val
  }
  const padBytes = [0xec, 0x11]
  for (let i = bits.length / 8, p = 0; i < spec.totalDataCodewords; i++, p++) {
    codewords[i] = padBytes[p % 2]
  }
  return codewords
}

function interleaveBlocks(data: Uint8Array, spec: VersionSpec): Uint8Array {
  const blockSize = Math.floor(spec.totalDataCodewords / spec.blocks)
  const dataBlocks: Uint8Array[] = []
  const ecBlocks: Uint8Array[] = []
  for (let b = 0; b < spec.blocks; b++) {
    const slice = data.subarray(b * blockSize, (b + 1) * blockSize)
    dataBlocks.push(slice)
    ecBlocks.push(rsComputeEc(slice, spec.ecPerBlock))
  }
  const out = new Uint8Array(spec.totalDataCodewords + spec.blocks * spec.ecPerBlock)
  let pos = 0
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.blocks; b++) out[pos++] = dataBlocks[b][i]
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) out[pos++] = ecBlocks[b][i]
  }
  return out
}

function drawFinder(grid: number[][], isFunc: boolean[][], r0: number, c0: number) {
  const size = grid.length
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const r = r0 + dr
      const c = c0 + dc
      if (r < 0 || r >= size || c < 0 || c >= size) continue
      const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6
      const border = dr === 0 || dr === 6 || dc === 0 || dc === 6
      const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
      grid[r][c] = inOuter && (border || core) ? 1 : 0
      isFunc[r][c] = true
    }
  }
}

function drawAlignment(grid: number[][], isFunc: boolean[][], cr: number, cc: number) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = cr + dr
      const c = cc + dc
      const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
      grid[r][c] = dark ? 1 : 0
      isFunc[r][c] = true
    }
  }
}

function applyFormatBits(grid: number[][], mask: number) {
  const size = grid.length
  const data = (0b01 << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537)
  const bits = ((data << 10) | rem) ^ 0x5412

  for (let i = 0; i <= 5; i++) grid[8][i] = (bits >> (14 - i)) & 1
  grid[8][7] = (bits >> 8) & 1
  grid[8][8] = (bits >> 7) & 1
  grid[7][8] = (bits >> 6) & 1
  for (let i = 0; i <= 5; i++) grid[5 - i][8] = (bits >> (5 - i)) & 1

  for (let i = 0; i <= 6; i++) grid[size - 1 - i][8] = (bits >> (14 - i)) & 1
  for (let i = 0; i <= 7; i++) grid[8][size - 8 + i] = (bits >> (7 - i)) & 1
}

function penaltyScore(grid: number[][]): number {
  const n = grid.length
  let score = 0
  for (let r = 0; r < n; r++) {
    let run = 1
    for (let c = 1; c < n; c++) {
      if (grid[r][c] === grid[r][c - 1]) {
        run++
        if (run === 5) score += 3
        else if (run > 5) score += 1
      } else run = 1
    }
  }
  for (let c = 0; c < n; c++) {
    let run = 1
    for (let r = 1; r < n; r++) {
      if (grid[r][c] === grid[r - 1][c]) {
        run++
        if (run === 5) score += 3
        else if (run > 5) score += 1
      } else run = 1
    }
  }
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = grid[r][c]
      if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) score += 3
    }
  }
  return score
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text.trim() || 'https://verocv.vn')
  const clipped = bytes.length > 134 ? bytes.subarray(0, 134) : bytes
  const spec = VERSIONS.find((v) => clipped.length <= v.dataCapBytes) ?? VERSIONS[VERSIONS.length - 1]
  const dataCodewords = encodeDataCodewords(clipped, spec)
  const allBytes = interleaveBlocks(dataCodewords, spec)

  const size = spec.version * 4 + 17
  const base: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(0))
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false))

  drawFinder(base, isFunc, 0, 0)
  drawFinder(base, isFunc, 0, size - 7)
  drawFinder(base, isFunc, size - 7, 0)

  for (const r of spec.alignCenters) {
    for (const c of spec.alignCenters) {
      if (!isFunc[r][c]) drawAlignment(base, isFunc, r, c)
    }
  }

  for (let i = 8; i < size - 8; i++) {
    base[6][i] = i % 2 === 0 ? 1 : 0
    isFunc[6][i] = true
    base[i][6] = i % 2 === 0 ? 1 : 0
    isFunc[i][6] = true
  }

  base[size - 8][8] = 1
  isFunc[size - 8][8] = true
  for (let i = 0; i < 9; i++) {
    isFunc[8][i] = true
    isFunc[i][8] = true
  }
  for (let i = 0; i < 8; i++) {
    isFunc[8][size - 1 - i] = true
    isFunc[size - 1 - i][8] = true
  }

  let bitIdx = 0
  const totalBits = allBytes.length * 8
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j
        const upward = ((right + 1) & 2) === 0
        const row = upward ? size - 1 - vert : vert
        if (!isFunc[row][col] && bitIdx < totalBits) {
          const byte = allBytes[bitIdx >> 3]
          base[row][col] = (byte >> (7 - (bitIdx & 7))) & 1
          bitIdx++
        }
      }
    }
  }

  const maskFn = (mask: number, r: number, c: number): boolean => {
    switch (mask) {
      case 0:
        return (r + c) % 2 === 0
      case 1:
        return r % 2 === 0
      case 2:
        return c % 3 === 0
      case 3:
        return (r + c) % 3 === 0
      case 4:
        return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
      case 5:
        return ((r * c) % 2) + ((r * c) % 3) === 0
      case 6:
        return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
      default:
        return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
    }
  }

  let bestScore = Infinity
  let bestGrid = base

  for (let mask = 0; mask < 8; mask++) {
    const candidate = base.map((row) => [...row])
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!isFunc[r][c] && maskFn(mask, r, c)) {
          candidate[r][c] ^= 1
        }
      }
    }
    applyFormatBits(candidate, mask)
    const sc = penaltyScore(candidate)
    if (sc < bestScore) {
      bestScore = sc
      bestGrid = candidate
    }
  }

  return bestGrid.map((row) => row.map((cell) => cell === 1))
}

export function qrMatrixToSvgString(matrix: boolean[][], sizePx = 128, fg = '#0f172a', bg = '#ffffff'): string {
  const n = matrix.length
  const margin = 2
  const viewSize = n + margin * 2
  const paths: string[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        paths.push(`M${c + margin},${r + margin}h1v1h-1z`)
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="${viewSize}" height="${viewSize}" fill="${bg}"/><path d="${paths.join('')}" fill="${fg}"/></svg>`
}
