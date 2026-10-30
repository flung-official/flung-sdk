// Golden values. A seed's Flungie must never change: people recognise theirs. These were taken from the prototype the
// package was ported from, and must only ever be added to. If one fails, the change broke existing avatars: put it
// behind a new VERSION instead (BUILDING.md, "Never change a seed's output").

import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { render, traits } from '../index.js'

const GOLDEN = [
  { seed: 'usr_8f3k2', hash: 2600464396, shape: 'wobbly', colour: 'ocean', eyes: 'ovals', mouth: 'none', blush: false, accessory: 'crown', side: 'left', lines: 'dusk', svg24: '14acd4c863cfab36', svg64: 'c84b4159d95053d5', svg128dark: 'd3c7352b6fd0a0ef' },
  { seed: 'usr_01hzx3k9qv', hash: 1232701983, shape: 'wobbly', colour: 'ink', eyes: 'wide', mouth: 'smile', blush: true, accessory: 'capBack', side: 'right', lines: 'twilight', svg24: 'ae46931d21e05274', svg64: '284631dbf549950d', svg128dark: '9b117ec03bff38fb' },
  { seed: 'usr_7d1c0b', hash: 53003148, shape: 'classic', colour: 'lilac', eyes: 'happy', mouth: 'none', blush: true, accessory: 'beanie', side: 'left', lines: 'lagoon', svg24: '55dc65e4fff5203f', svg64: '258451cd8229d12f', svg128dark: '90ff8f28524741f2' },
  { seed: 'usr_a', hash: 403490939, shape: 'squat', colour: 'ocean', eyes: 'happy', mouth: 'smile', blush: true, accessory: 'antenna', side: 'left', lines: 'sunset', svg24: '22b3527e00f5221b', svg64: '9a00704aadda1660', svg128dark: '2fcd598f9f9f5086' },
  { seed: 'usr_b', hash: 4015203235, shape: 'squat', colour: 'ink', eyes: 'wide', mouth: 'none', blush: true, accessory: 'headphones', side: 'right', lines: 'brand', svg24: 'd116564b4ef24421', svg64: '6048f400924005e7', svg128dark: 'd0966a39e78b37e7' },
  { seed: 'ws_northwind', hash: 1238081483, shape: 'classic', colour: 'ocean', eyes: 'wink', mouth: 'smile', blush: false, accessory: 'none', side: 'right', lines: 'sunset', svg24: 'c47234ffe978b875', svg64: 'd12b152d8c1c7afc', svg128dark: 'ae577cf696bc5918' },
  { seed: 'sacha@flung.dev', hash: 3033499043, shape: 'puffy', colour: 'ink', eyes: 'sleepy', mouth: 'none', blush: true, accessory: 'bow', side: 'left', lines: 'lagoon', svg24: 'e2f4fbe4b51e2d7e', svg64: '99b3365a43f198f2', svg128dark: '270724aad78939cb' },
  { seed: 'maya@northwind.studio', hash: 1928472118, shape: 'tall', colour: 'ocean', eyes: 'dots', mouth: 'cat', blush: true, accessory: 'halo', side: 'left', lines: 'lagoon', svg24: 'e8c3ec96080bbf04', svg64: '908d6b8825bfc141', svg128dark: 'da3e622378e6c61d' },
  { seed: 'flung', hash: 3224118115, shape: 'tall', colour: 'ocean', eyes: 'wink', mouth: 'none', blush: true, accessory: 'crown', side: 'left', lines: 'lagoon', svg24: 'e4140b67354e0470', svg64: 'f80e742e2f9fe8ec', svg128dark: 'f68d1320c994cb3a' },
  { seed: 'Flung', hash: 3224118115, shape: 'tall', colour: 'ocean', eyes: 'wink', mouth: 'none', blush: true, accessory: 'crown', side: 'left', lines: 'lagoon', svg24: 'e4140b67354e0470', svg64: 'f80e742e2f9fe8ec', svg128dark: 'f68d1320c994cb3a' },
  { seed: '  padded seed  ', hash: 927727559, shape: 'classic', colour: 'peach', eyes: 'dots', mouth: 'none', blush: false, accessory: 'bow', side: 'left', lines: 'brand', svg24: '8c3601e91846c1a1', svg64: 'aebceb5be1e417de', svg128dark: '1cdbccce34c2f5a2' },
  { seed: '', hash: 2872998923, shape: 'classic', colour: 'coral', eyes: 'wide', mouth: 'o', blush: false, accessory: 'glasses', side: 'left', lines: 'twilight', svg24: '58adc30e07f309b5', svg64: 'f57f4b0d7293bd7f', svg128dark: 'f33e420410b15cfa' },
  { seed: '0', hash: 1693486945, shape: 'squat', colour: 'moss', eyes: 'happy', mouth: 'cat', blush: false, accessory: 'headphones', side: 'right', lines: 'sunset', svg24: '008ab09d22e2081a', svg64: '2b60762c6ab04420', svg128dark: '9c5f0c6121f83e1b' },
  { seed: '42', hash: 686566589, shape: 'round', colour: 'sand', eyes: 'dots', mouth: 'grin', blush: true, accessory: 'cap', side: 'left', lines: 'twilight', svg24: 'a8f7e48a1e4f58a8', svg64: '555279a60e30a049', svg128dark: '1fa1b5caada171c7' },
  { seed: 'ünïcødé', hash: 379909559, shape: 'round', colour: 'lilac', eyes: 'dots', mouth: 'none', blush: false, accessory: 'pencil', side: 'left', lines: 'dusk', svg24: '25cf273340fabd44', svg64: 'cbf2a9a84ab46feb', svg128dark: '23269253796c02c6' },
  { seed: 'a-very-long-seed-that-keeps-going-and-going-for-a-while-0123456789', hash: 1551415491, shape: 'round', colour: 'peach', eyes: 'sleepy', mouth: 'o', blush: true, accessory: 'none', side: 'left', lines: 'sunset', svg24: '4f48ceb695f5ea4b', svg64: '6fe999a100fa59de', svg128dark: '3be18b792452075a' },
  { seed: 'org_demo', hash: 2774260376, shape: 'wobbly', colour: 'lilac', eyes: 'wink', mouth: 'grin', blush: false, accessory: 'headphones', side: 'left', lines: 'ember', svg24: 'ba9dc3172d48c858', svg64: '63f17f43c4b5a586', svg128dark: '1b7d89455e978915' },
  { seed: 'mem_1', hash: 156652774, shape: 'wobbly', colour: 'mint', eyes: 'dots', mouth: 'smile', blush: false, accessory: 'headphones', side: 'left', lines: 'dusk', svg24: 'a6a015d55baabd7a', svg64: 'e3fe95cf737d6533', svg128dark: '8b36b8b9d250dc7b' },
  { seed: 'mem_2', hash: 374718146, shape: 'round', colour: 'rust', eyes: 'wide', mouth: 'cat', blush: true, accessory: 'pencil', side: 'left', lines: 'brand', svg24: 'da40e85c49f2c6e2', svg64: 'bf7d5f48cc9eb1c3', svg128dark: 'e67ee987e87668e1' },
  { seed: 'creator', hash: 3806243360, shape: 'squat', colour: 'moss', eyes: 'dots', mouth: 'cat', blush: true, accessory: 'glasses', side: 'left', lines: 'brand', svg24: 'c0b47c12b6dcd7d4', svg64: '6245a74ac15bd71f', svg128dark: 'e937b9d71df2f9c5' },
]

const sha = (svg: string) => createHash('sha256').update(svg).digest('hex').slice(0, 16)

describe('golden seeds', () => {
  it.each(GOLDEN)('$seed keeps its traits', (g) => {
    const t = traits(g.seed)
    expect({ hash: t.hash, shape: t.shape, colour: t.colour, eyes: t.eyes, mouth: t.mouth, blush: t.blush, accessory: t.accessory, side: t.side, lines: t.lines }).toEqual({
      hash: g.hash, shape: g.shape, colour: g.colour, eyes: g.eyes, mouth: g.mouth, blush: g.blush, accessory: g.accessory, side: g.side, lines: g.lines,
    })
  })

  it.each(GOLDEN)('$seed keeps its drawing at 24, 64 and 128 px', (g) => {
    const t = traits(g.seed)
    expect(sha(render(t, { size: 24, id: 'x' }))).toBe(g.svg24)
    expect(sha(render(t, { size: 64, id: 'x' }))).toBe(g.svg64)
    expect(sha(render(t, { size: 128, theme: 'dark', id: 'x' }))).toBe(g.svg128dark)
  })
})
