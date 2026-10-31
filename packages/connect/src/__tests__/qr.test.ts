import { describe, expect, it } from 'vitest'

import { encodeQr } from '../core/qr.js'
import { GOLDEN } from './qr-golden.js'

const hexRows = (modules: readonly (readonly boolean[])[]) => modules.map((row) => BigInt(`0b${row.map((dark) => (dark ? '1' : '0')).join('')}`).toString(16))

describe('encodeQr', () => {
  it.each(GOLDEN)('draws $text module for module as Project Nayuki’s generator does (version $version)', ({ text, size, rows }) => {
    const code = encodeQr(text)
    expect(code.size).toBe(size)
    expect(hexRows(code.modules)).toEqual(rows)
  })

  it('refuses a text too long for any QR code', () => {
    expect(() => encodeQr('x'.repeat(3000))).toThrow(RangeError)
  })
})
