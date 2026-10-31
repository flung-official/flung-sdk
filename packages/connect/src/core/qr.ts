/**
 * A QR code of a short text, such as the link that opens Warpcast to approve Flung: byte mode, error correction level M,
 * the smallest version that holds it, and the mask with the lowest penalty. Written here so the package keeps no runtime
 * dependency. It follows Project Nayuki's QR Code generator (MIT, https://www.nayuki.io/page/qr-code-generator-library)
 * step for step, so its output is that library's, module for module.
 */

/** Error correction codewords per block at level M, by version (index 0 unused). */
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
/** Error correction blocks at level M, by version (index 0 unused). */
const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
/** Level M's two format bits. */
const FORMAT_BITS_M = 0
const PENALTY_N1 = 3
const PENALTY_N2 = 3
const PENALTY_N3 = 40
const PENALTY_N4 = 10

/** The code as rows of modules, `true` for dark, with no quiet zone: draw one of at least four light modules around it. */
export interface QrMatrix {
  readonly size: number
  readonly modules: readonly (readonly boolean[])[]
}

/** Encodes `text` as UTF-8. Throws a `RangeError` when it is too long for a QR code (about 2,300 bytes at level M). */
export function encodeQr(text: string): QrMatrix {
  const bytes = new TextEncoder().encode(text)
  let version = 1
  for (; ; version += 1) {
    if (version > 40) throw new RangeError('The text is too long for a QR code.')
    if (4 + countBits(version) + bytes.length * 8 <= dataCodewords(version) * 8) break
  }
  const bits: number[] = []
  const append = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1)
  }
  append(0x4, 4)
  append(bytes.length, countBits(version))
  for (const byte of bytes) append(byte, 8)
  const capacity = dataCodewords(version) * 8
  append(0, Math.min(4, capacity - bits.length))
  append(0, (8 - (bits.length % 8)) % 8)
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) append(pad, 8)
  const data: number[] = new Array<number>(bits.length / 8).fill(0)
  bits.forEach((bit, i) => {
    data[i >>> 3] = (data[i >>> 3] as number) | (bit << (7 - (i & 7)))
  })
  return new Grid(version).draw(interleave(version, data))
}

const countBits = (version: number) => (version <= 9 ? 8 : 16)

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2
    result -= (25 * align - 10) * align - 55
    if (version >= 7) result -= 36
  }
  return result
}

const dataCodewords = (version: number) => Math.floor(rawDataModules(version) / 8) - (ECC_PER_BLOCK[version] as number) * (BLOCKS[version] as number)

/** Splits the data into blocks, adds each block's Reed-Solomon codewords, and interleaves them. */
function interleave(version: number, data: readonly number[]): number[] {
  const blocks = BLOCKS[version] as number
  const eccLength = ECC_PER_BLOCK[version] as number
  const raw = Math.floor(rawDataModules(version) / 8)
  const shortBlocks = blocks - (raw % blocks)
  const shortLength = Math.floor(raw / blocks)
  const divisor = rsDivisor(eccLength)
  const split: number[][] = []
  for (let i = 0, k = 0; i < blocks; i += 1) {
    const block = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1))
    k += block.length
    const ecc = rsRemainder(block, divisor)
    if (i < shortBlocks) block.push(0)
    split.push(block.concat(ecc))
  }
  const result: number[] = []
  for (let i = 0; i < (split[0] as number[]).length; i += 1) {
    split.forEach((block, j) => {
      if (i !== shortLength - eccLength || j >= shortBlocks) result.push(block[i] as number)
    })
  }
  return result
}

function rsMultiply(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array<number>(degree - 1).fill(0).concat([1])
  let root = 1
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = rsMultiply(result[j] as number, root)
      if (j + 1 < result.length) result[j] = (result[j] as number) ^ (result[j + 1] as number)
    }
    root = rsMultiply(root, 0x02)
  }
  return result
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result: number[] = divisor.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number)
    result.push(0)
    divisor.forEach((coefficient, i) => {
      result[i] = (result[i] as number) ^ rsMultiply(coefficient, factor)
    })
  }
  return result
}

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0

class Grid {
  readonly #size: number
  readonly #version: number
  readonly #modules: boolean[][]
  readonly #fixed: boolean[][]

  constructor(version: number) {
    this.#version = version
    this.#size = version * 4 + 17
    this.#modules = Array.from({ length: this.#size }, () => new Array<boolean>(this.#size).fill(false))
    this.#fixed = Array.from({ length: this.#size }, () => new Array<boolean>(this.#size).fill(false))
  }

  draw(codewords: readonly number[]): QrMatrix {
    this.#functionPatterns()
    this.#codewords(codewords)
    let best = 0
    let lowest = Infinity
    for (let mask = 0; mask < 8; mask += 1) {
      this.#mask(mask)
      this.#format(mask)
      const penalty = this.#penalty()
      if (penalty < lowest) {
        best = mask
        lowest = penalty
      }
      this.#mask(mask)
    }
    this.#mask(best)
    this.#format(best)
    return { size: this.#size, modules: this.#modules.map((row) => [...row]) }
  }

  #set(x: number, y: number, dark: boolean): void {
    ;(this.#modules[y] as boolean[])[x] = dark
    ;(this.#fixed[y] as boolean[])[x] = true
  }

  #functionPatterns(): void {
    const size = this.#size
    for (let i = 0; i < size; i += 1) {
      this.#set(6, i, i % 2 === 0)
      this.#set(i, 6, i % 2 === 0)
    }
    this.#finder(3, 3)
    this.#finder(size - 4, 3)
    this.#finder(3, size - 4)
    const positions = this.#alignmentPositions()
    const last = positions.length - 1
    positions.forEach((x, i) => {
      positions.forEach((y, j) => {
        if (!((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0))) this.#alignment(x, y)
      })
    })
    this.#format(0)
    this.#versionInfo()
  }

  #finder(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy))
        const xx = x + dx
        const yy = y + dy
        if (xx >= 0 && xx < this.#size && yy >= 0 && yy < this.#size) this.#set(xx, yy, distance !== 2 && distance !== 4)
      }
    }
  }

  #alignment(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) this.#set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }

  #alignmentPositions(): number[] {
    if (this.#version === 1) return []
    const count = Math.floor(this.#version / 7) + 2
    const step = Math.floor((this.#version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2
    const result = [6]
    for (let position = this.#size - 7; result.length < count; position -= step) result.splice(1, 0, position)
    return result
  }

  #format(mask: number): void {
    const data = (FORMAT_BITS_M << 3) | mask
    let remainder = data
    for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537)
    const bits = ((data << 10) | remainder) ^ 0x5412
    const size = this.#size
    for (let i = 0; i <= 5; i += 1) this.#set(8, i, bit(bits, i))
    this.#set(8, 7, bit(bits, 6))
    this.#set(8, 8, bit(bits, 7))
    this.#set(7, 8, bit(bits, 8))
    for (let i = 9; i < 15; i += 1) this.#set(14 - i, 8, bit(bits, i))
    for (let i = 0; i < 8; i += 1) this.#set(size - 1 - i, 8, bit(bits, i))
    for (let i = 8; i < 15; i += 1) this.#set(8, size - 15 + i, bit(bits, i))
    this.#set(8, size - 8, true)
  }

  #versionInfo(): void {
    if (this.#version < 7) return
    let remainder = this.#version
    for (let i = 0; i < 12; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25)
    const bits = (this.#version << 12) | remainder
    for (let i = 0; i < 18; i += 1) {
      const a = this.#size - 11 + (i % 3)
      const b = Math.floor(i / 3)
      this.#set(a, b, bit(bits, i))
      this.#set(b, a, bit(bits, i))
    }
  }

  #codewords(data: readonly number[]): void {
    const size = this.#size
    let i = 0
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5
      for (let vertical = 0; vertical < size; vertical += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = right - j
          const upward = ((right + 1) & 2) === 0
          const y = upward ? size - 1 - vertical : vertical
          if (!(this.#fixed[y] as boolean[])[x] && i < data.length * 8) {
            ;(this.#modules[y] as boolean[])[x] = bit(data[i >>> 3] as number, 7 - (i & 7))
            i += 1
          }
        }
      }
    }
  }

  /** Flips the data modules under `mask`; applying it twice undoes it. */
  #mask(mask: number): void {
    for (let y = 0; y < this.#size; y += 1) {
      for (let x = 0; x < this.#size; x += 1) {
        const flip = [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, ((x * y) % 2) + ((x * y) % 3) === 0, (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (((x + y) % 2) + ((x * y) % 3)) % 2 === 0][mask]
        const row = this.#modules[y] as boolean[]
        if (flip === true && !(this.#fixed[y] as boolean[])[x]) row[x] = !row[x]
      }
    }
  }

  #penalty(): number {
    const size = this.#size
    const at = (x: number, y: number) => (this.#modules[y] as boolean[])[x] as boolean
    let result = 0
    for (const across of [true, false]) {
      for (let a = 0; a < size; a += 1) {
        let color = false
        let run = 0
        const history = [0, 0, 0, 0, 0, 0, 0]
        for (let b = 0; b < size; b += 1) {
          const dark = across ? at(b, a) : at(a, b)
          if (dark === color) {
            run += 1
            if (run === 5) result += PENALTY_N1
            else if (run > 5) result += 1
          } else {
            this.#history(run, history)
            if (!color) result += this.#finderLike(history) * PENALTY_N3
            color = dark
            run = 1
          }
        }
        if (color) {
          this.#history(run, history)
          run = 0
        }
        this.#history(run + size, history)
        result += this.#finderLike(history) * PENALTY_N3
      }
    }
    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const color = at(x, y)
        if (color === at(x + 1, y) && color === at(x, y + 1) && color === at(x + 1, y + 1)) result += PENALTY_N2
      }
    }
    const dark = this.#modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
    const total = size * size
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * PENALTY_N4
    return result
  }

  #history(run: number, history: number[]): void {
    history.pop()
    history.unshift(history[0] === 0 ? run + this.#size : run)
  }

  #finderLike(history: readonly number[]): number {
    const [h0, n, h2, h3, h4, h5, h6] = history as [number, number, number, number, number, number, number]
    const core = n > 0 && h2 === n && h3 === n * 3 && h4 === n && h5 === n
    return (core && h0 >= n * 4 && h6 >= n ? 1 : 0) + (core && h6 >= n * 4 && h0 >= n ? 1 : 0)
  }
}
