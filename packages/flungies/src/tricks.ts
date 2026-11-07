/**
 * Tricks: a one-shot move a Flungie does, on hover or when something happens (a post goes out): a spin, a wave, a jump or a
 * flip. A trick moves the whole drawing with the Web Animations API, so it needs no stylesheet and works on any element that
 * holds a Flungie's SVG: <flung-ie>, <Flungie> or a plain container. Nothing moves where the person asked for reduced motion,
 * and nothing happens where there is no DOM (a server).
 *
 *   playTrick(el, 'jump')                       // once, now
 *   <flung-ie seed="usr_8f3k2" trick="spin">    // on hover
 *   <Flungie seed={id} trick="wave" />          // on hover
 */

export const TRICKS = ['spin', 'wave', 'jump', 'flip'] as const
export type Trick = (typeof TRICKS)[number]

export interface TrickMotion {
  keyframes: Keyframe[]
  /** Milliseconds. */
  duration: number
  easing: string
}

/** Each trick's motion, as keyframes on the SVG, about its middle. Plain data, for a page that animates some other way. */
export const TRICK_MOTIONS: Readonly<Record<Trick, TrickMotion>> = {
  spin: {
    keyframes: [{ transform: 'rotate(0deg) scale(1)' }, { transform: 'rotate(200deg) scale(0.92)', offset: 0.55 }, { transform: 'rotate(360deg) scale(1)' }],
    duration: 700,
    easing: 'cubic-bezier(0.45, 0, 0.25, 1)',
  },
  wave: {
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-12deg)', offset: 0.2 },
      { transform: 'rotate(10deg)', offset: 0.45 },
      { transform: 'rotate(-7deg)', offset: 0.7 },
      { transform: 'rotate(0deg)' },
    ],
    duration: 800,
    easing: 'ease-in-out',
  },
  jump: {
    keyframes: [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(2%) scale(1.08, 0.9)', offset: 0.15 },
      { transform: 'translateY(-22%) scale(0.94, 1.06)', offset: 0.5 },
      { transform: 'translateY(1%) scale(1.06, 0.94)', offset: 0.85 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    duration: 650,
    easing: 'cubic-bezier(0.3, 0, 0.3, 1)',
  },
  flip: {
    keyframes: [{ transform: 'perspective(400px) rotateY(0deg)' }, { transform: 'perspective(400px) rotateY(360deg)' }],
    duration: 750,
    easing: 'cubic-bezier(0.5, 0, 0.3, 1)',
  },
}

/** Whether `value` names a trick. */
export const isTrick = (value: unknown): value is Trick => typeof value === 'string' && (TRICKS as readonly string[]).includes(value)

/**
 * Plays a trick once on the Flungie in `target` (the SVG itself, or an element holding one or the WebGL hero), and answers
 * its Animation, or null where motion is reduced, there is no Flungie in it, or the browser cannot animate. A trick already
 * playing is replaced.
 */
export function playTrick(target: Element, trick: Trick): Animation | null {
  const view = target.ownerDocument?.defaultView
  if (!view || view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null
  // The SVG, or the element itself when it holds the WebGL hero instead.
  const node = (target instanceof view.SVGSVGElement ? target : target.querySelector('svg')) ?? (target.querySelector('canvas') ? target : null)
  if (!node || typeof node.animate !== 'function') return null
  for (const running of node.getAnimations?.() ?? []) if (running.id === 'fl-trick') running.cancel()
  const motion = TRICK_MOTIONS[trick]
  const style = (node as HTMLElement | SVGElement).style
  style.transformOrigin = '50% 55%'
  style.overflow = 'visible'
  return node.animate(motion.keyframes, { duration: motion.duration, easing: motion.easing, id: 'fl-trick' })
}
