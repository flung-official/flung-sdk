/**
 * How each outfit (OUTFITS) is drawn: a garment over more of the body than pants, a jumper, a dress, a suit or a costume, or a
 * sheet over the whole Flungie like a ghost. A seed never picks one, so a new outfit is an entry in OUTFITS and one here, and
 * no one's drawing changes. In the body's frame; nothing under 32 px.
 *
 * `back` is drawn behind the body, as a cape or wings are. `under` is drawn under the face, as pants are, so the face stays on
 * top. `over` is drawn over it: a ghost's sheet hides the face, with eye holes and a mouth of its own where the face's eyes
 * are, a mummy's wrappings leave a gap at the eyes, a mask goes round them, and ears and antennae sit on the head.
 *
 * With `animate`, wings flutter, capes and a scarf's end wave, ears twitch and stars twinkle (SMIL, as auras move); leave it
 * off where motion is reduced.
 */
import type { Geometry } from '../geometry.js'
import { ghost, mummy, pumpkin, santa, skeleton, suit } from './costumes.js'
import { cat, dinosaur, dragon, penguin, shark, unicorn } from './critters.js'
import { bear, bee, bunny, fairy, frog, scarf, superhero, wizard } from './cute.js'
import { astronaut, newYearJacket, pirate } from './dressup.js'
import { coat, jumper, sundress } from './garments.js'
import type { EyesAt, OutfitDrawn } from './parts.js'

export type { EyesAt, OutfitDrawn } from './parts.js'

const NOTHING: OutfitDrawn = { back: '', under: '', over: '' }

/** An outfit in the body's frame, behind the body, under the face and over it, with its clips and shading added to `defs`. */
export function outfit(kind: string, G: Geometry, id: string, defs: string[], detail: number, eyes: EyesAt, animate = false): OutfitDrawn {
  if (detail === 0) return NOTHING
  // Just under the mouth: a garment starts no higher, so the face stays clear on a tall Flungie too.
  const chin = eyes.y + eyes.r + 6.8
  const under = (drawn: string): OutfitDrawn => ({ back: '', under: drawn, over: '' })
  switch (kind) {
    case 'jumper':
      return under(jumper(G, id, defs, detail, chin, { base: '#F0B44C', rib: '#C58A2A' }))
    case 'festive':
      return under(jumper(G, id, defs, detail, chin, { base: '#C8323A', rib: '#2E7D4F', band: '#FFFFFF', flecks: '#FFFFFF' }))
    case 'sweetheart':
      return under(jumper(G, id, defs, detail, chin, { base: '#FFB3C6', rib: '#E0577A', heart: '#E0365F' }))
    case 'sundress':
      return under(sundress(G, id, defs, detail, chin))
    case 'santa':
      return under(santa(G, id, defs, detail, chin))
    case 'ghost':
      return { back: '', under: '', over: ghost(G, detail, eyes) }
    case 'pumpkin':
      return under(pumpkin(G, id, defs, detail, chin))
    case 'skeleton':
      return under(skeleton(G, id, defs, detail, chin))
    case 'vampire':
      return suit(G, id, defs, detail, chin, { jacket: '#1E1C27', bow: '#C8323A', cape: { outside: '#1E1C27', inside: '#B3243A' } })
    case 'mummy':
      return { back: '', under: '', over: mummy(G, id, defs, detail, eyes) }
    case 'tuxedo':
      return suit(G, id, defs, detail, chin, { jacket: '#23212D', bow: '#23212D' })
    case 'raincoat':
      return under(coat(G, id, defs, detail, chin, { base: '#F5C838', trim: '#C99A16', buttons: '#2B2834' }))
    case 'aloha':
      return under(coat(G, id, defs, detail, chin, { base: '#2BA7A0', trim: '#1D7A75', buttons: '#FFFFFF', flowers: ['#FF8FA8', '#FFFFFF', '#FF7E6E'] }))
    case 'bee':
      return bee(G, id, defs, detail, chin, animate)
    case 'frog':
      return frog(G, id, defs, detail, chin, animate)
    case 'bear':
      return bear(G, id, defs, detail, chin, animate)
    case 'bunny':
      return bunny(G, id, defs, detail, chin, animate)
    case 'fairy':
      return fairy(G, id, defs, detail, animate)
    case 'superhero':
      return superhero(G, id, defs, detail, chin, eyes, animate)
    case 'wizard':
      return under(wizard(G, id, defs, detail, chin, animate))
    case 'scarf':
      return under(scarf(G, id, defs, detail, chin, animate))
    case 'dinosaur':
      return dinosaur(G, id, defs, detail, chin, animate)
    case 'cat':
      return cat(G, id, defs, detail, chin, animate)
    case 'shark':
      return shark(G, id, defs, detail, chin, animate)
    case 'penguin':
      return penguin(G, id, defs, detail, chin, animate)
    case 'unicorn':
      return unicorn(G, id, defs, detail, chin, animate)
    case 'dragon':
      return dragon(G, id, defs, detail, chin, eyes, animate)
    case 'pirate':
      return pirate(G, id, defs, detail, chin, eyes, animate)
    case 'astronaut':
      return astronaut(G, id, defs, detail, chin, animate)
    case 'newYearJacket':
      return under(newYearJacket(G, id, defs, detail, chin, animate))
    default:
      return NOTHING
  }
}
