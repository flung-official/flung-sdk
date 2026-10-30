// Golden values for workspace marks. A workspace's mark must never change: its members recognise it. These were frozen
// when marks first shipped and must only ever be added to. If one fails, the change altered existing marks: put it behind
// a new option instead (BUILDING.md, "Never change a seed's output").

import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { markTraits, renderMark } from '../marks/index.js'

const GOLDEN: { seed: string; name?: string; hash: number; pattern: string; pair: string; finish: string; scale: string; angle: number; centre: string; rhythm: string; signature: string; svg24: string; svg64: string; svg128dark: string }[] = [
  { seed: 'ws_northwind', name: 'Northwind Studio', hash: 1238081483, pattern: 'lines', pair: 'mint', finish: 'deboss', scale: 'medium', angle: -14, centre: 'bottomRight', rhythm: 'brand', signature: 'none', svg24: '6e792d2696610216', svg64: 'aa0e946a9fb67f01', svg128dark: '8c88def0f51e25a3' },
  { seed: 'ws_7hq2m0x4kd9wza', name: 'maya@northwind.studio\'s workspace', hash: 590666710, pattern: 'tiles', pair: 'ink', finish: 'emboss', scale: 'medium', angle: 24, centre: 'left', rhythm: 'dash', signature: 'topRight', svg24: 'fa50b82b46efb293', svg64: '29fdb61b60cc076e', svg128dark: 'e44f10391cb4f7bd' },
  { seed: 'ws_k2v9d3m8qp1tnb', name: 'Northwind Studio', hash: 2052629258, pattern: 'tiles', pair: 'rust', finish: 'emboss', scale: 'fine', angle: 14, centre: 'topLeft', rhythm: 'brand', signature: 'bottomRight', svg24: 'a5826b0eff677dcc', svg64: '19599017f9df62c9', svg128dark: '68e9232700508456' },
  { seed: 'ws_c4r8x2wq7j0hsm', name: 'Lumen Labs', hash: 3653682068, pattern: 'tiles', pair: 'ink', finish: 'emboss', scale: 'medium', angle: 0, centre: 'left', rhythm: 'long', signature: 'topRight', svg24: '24aaeaba4688252a', svg64: 'f56c79ec2bee295a', svg128dark: '4d512626627df4e7' },
  { seed: 'ws_p0n6t3z9b5vy2e', name: 'Quill Agency', hash: 3244328959, pattern: 'ripples', pair: 'moss', finish: 'deboss', scale: 'fine', angle: 8, centre: 'left', rhythm: 'brand', signature: 'topRight', svg24: '6d860710ca080590', svg64: 'be902e8c292a3a4b', svg128dark: 'd568fa02b4764f74' },
  { seed: 'ws_e9j3w5r1x8kq4d', name: 'Kettle & Co', hash: 3056048878, pattern: 'tiles', pair: 'lilac', finish: 'emboss', scale: 'fine', angle: -14, centre: 'topRight', rhythm: 'even', signature: 'none', svg24: '664306eaedaa5f4d', svg64: '9a59c6d01249e512', svg128dark: 'be0075e2eabd2f12' },
  { seed: 'ws_bnc0a1f9e3t6wq', name: 'Brave New Coin', hash: 626905077, pattern: 'ripples', pair: 'lilac', finish: 'emboss', scale: 'bold', angle: 8, centre: 'left', rhythm: 'even', signature: 'bottomRight', svg24: '601b9d4f0bd57cc1', svg64: 'b798d50c3fa2ba64', svg128dark: '9c97fbcd2afe9f13' },
  { seed: 'ws_1', name: 'Acme', hash: 4043979104, pattern: 'lines', pair: 'coral', finish: 'deboss', scale: 'medium', angle: -14, centre: 'centre', rhythm: 'dash', signature: 'none', svg24: '3c6c4fb065ab25c8', svg64: '3ef091306f4cf040', svg128dark: '09a052acb0bd2b96' },
  { seed: 'ws_2', name: 'Bravo', hash: 1327660819, pattern: 'tiles', pair: 'berry', finish: 'emboss', scale: 'fine', angle: 8, centre: 'bottomRight', rhythm: 'long', signature: 'none', svg24: 'c66603ae8b34aa10', svg64: 'deb71fe4d95ce1b2', svg128dark: '3da84880ab3ec226' },
  { seed: 'ws_7', name: 'Smoke tests', hash: 3156256956, pattern: 'lines', pair: 'sky', finish: 'emboss', scale: 'fine', angle: 8, centre: 'topLeft', rhythm: 'even', signature: 'none', svg24: '5ebd21c87ee65301', svg64: 'd27f35cd4c4bf0f5', svg128dark: 'd9cf7903693f966e' },
  { seed: 'ws_9', name: 'Sandbox', hash: 3143951509, pattern: 'ripples', pair: 'sand', finish: 'deboss', scale: 'bold', angle: -14, centre: 'topRight', rhythm: 'brand', signature: 'topLeft', svg24: '1894d735481ad6df', svg64: '32736f863124b915', svg128dark: '634d024c45a81a5e' },
  { seed: 'ws_134', name: 'Cloud Nine', hash: 2763584553, pattern: 'ripples', pair: 'cloud', finish: 'emboss', scale: 'fine', angle: -14, centre: 'bottomLeft', rhythm: 'brand', signature: 'topRight', svg24: 'ddab0d48c3398bfa', svg64: '36a0d2b3a13755ab', svg128dark: 'e3a449f6184dad6f' },
  { seed: 'ws_other', name: 'john.doe@acme.io', hash: 3863387032, pattern: 'ripples', pair: 'plum', finish: 'deboss', scale: 'fine', angle: -14, centre: 'bottomLeft', rhythm: 'dash', signature: 'none', svg24: '897641b9c9fb223b', svg64: 'ce4fa90158984e5b', svg128dark: 'b189a311bf5f4a37' },
  { seed: 'org_demo', name: 'GitHub', hash: 2774260376, pattern: 'tiles', pair: 'mint', finish: 'emboss', scale: 'bold', angle: 24, centre: 'topLeft', rhythm: 'dash', signature: 'none', svg24: '7f92760f367fb692', svg64: '006948c48c06e6ff', svg128dark: '116d0d79a4df4b60' },
  { seed: 'flung', name: 'Flung', hash: 3224118115, pattern: 'ripples', pair: 'ocean', finish: 'deboss', scale: 'bold', angle: 14, centre: 'topRight', rhythm: 'even', signature: 'none', svg24: '1aa9fcfbfbe9812d', svg64: 'e7f1ef306e9639c4', svg128dark: 'd2c1246d0ab529b5' },
  { seed: 'Flung', name: 'Flung', hash: 3224118115, pattern: 'ripples', pair: 'ocean', finish: 'deboss', scale: 'bold', angle: 14, centre: 'topRight', rhythm: 'even', signature: 'none', svg24: '1aa9fcfbfbe9812d', svg64: 'e7f1ef306e9639c4', svg128dark: 'd2c1246d0ab529b5' },
  { seed: '  padded seed  ', hash: 927727559, pattern: 'lines', pair: 'butter', finish: 'emboss', scale: 'bold', angle: 8, centre: 'topLeft', rhythm: 'dash', signature: 'topLeft', svg24: '93edf0e3be79f013', svg64: 'b1448ef2c687adb2', svg128dark: '6f807760d4255541' },
  { seed: '', hash: 2872998923, pattern: 'lines', pair: 'mint', finish: 'emboss', scale: 'fine', angle: -14, centre: 'bottomLeft', rhythm: 'long', signature: 'none', svg24: '9c3a0dd0f2f9f503', svg64: '0de9a8ac7547d781', svg128dark: '9a1185ab41c701c4' },
  { seed: '0', name: '0', hash: 1693486945, pattern: 'lines', pair: 'lilac', finish: 'emboss', scale: 'medium', angle: 24, centre: 'topLeft', rhythm: 'brand', signature: 'bottomLeft', svg24: 'dcb7e37028943cea', svg64: '626baf0eb8f51eae', svg128dark: '1ed2359a036945df' },
  { seed: '42', name: '42 Studio', hash: 686566589, pattern: 'ripples', pair: 'berry', finish: 'deboss', scale: 'fine', angle: 8, centre: 'bottom', rhythm: 'dash', signature: 'bottomLeft', svg24: '22f604de84c3101d', svg64: '97dd24724bd61076', svg128dark: 'd3340d533b3314fd' },
  { seed: 'ünïcødé', name: 'Ünïcødé Ateliér', hash: 379909559, pattern: 'lines', pair: 'butter', finish: 'emboss', scale: 'medium', angle: 0, centre: 'centre', rhythm: 'brand', signature: 'bottomLeft', svg24: '374268026e09ccf4', svg64: 'b4270013757d0732', svg128dark: 'd0885c3e37e14112' },
  { seed: 'a-very-long-seed-that-keeps-going-and-going-for-a-while-0123456789', name: 'Pocket <Bakery> & "Co"', hash: 1551415491, pattern: 'lines', pair: 'mint', finish: 'emboss', scale: 'bold', angle: 0, centre: 'centre', rhythm: 'even', signature: 'topRight', svg24: 'b19c9298575d7d37', svg64: '373e18a87d8e2eb7', svg128dark: '18e3984e280d2407' },
]

const sha = (svg: string) => createHash('sha256').update(svg).digest('hex').slice(0, 16)

describe('golden workspace marks', () => {
  it.each(GOLDEN)('$seed keeps its traits', (g) => {
    const t = markTraits(g.seed)
    expect({ hash: t.hash, pattern: t.pattern, pair: t.pair, finish: t.finish, scale: t.scale, angle: t.angle, centre: t.centre, rhythm: t.rhythm, signature: t.signature }).toEqual({
      hash: g.hash, pattern: g.pattern, pair: g.pair, finish: g.finish, scale: g.scale, angle: g.angle, centre: g.centre, rhythm: g.rhythm, signature: g.signature,
    })
  })

  it.each(GOLDEN)('$seed keeps its drawing at 24, 64 and 128 px', (g) => {
    const t = markTraits(g.seed)
    expect(sha(renderMark(t, { size: 24, name: g.name, id: 'x' }))).toBe(g.svg24)
    expect(sha(renderMark(t, { size: 64, name: g.name, id: 'x' }))).toBe(g.svg64)
    expect(sha(renderMark(t, { size: 128, theme: 'dark', name: g.name, id: 'x' }))).toBe(g.svg128dark)
  })
})
