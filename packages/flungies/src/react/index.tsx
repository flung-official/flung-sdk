// <Flungie>: the SVG Flungie as a React component, and the animated WebGL one at hero sizes.
//
//   <Flungie seed={user.id} size={32} theme="dark" />
//   <Flungie seed={user.id} size={240} animated />   // loads @flung.dev/flungies/gl only when it is shown
//
// The SVG renders on a server too, with ids from useId, so it hydrates without a mismatch. With `animated` and a size
// of 160 or more, the SVG shows first and the WebGL hero takes its place once its code has loaded.

import { type CSSProperties, useEffect, useId, useMemo, useRef, useState } from 'react'

import type { FlungieGL } from '../gl/index.js'
import { type FlungieOptions, render } from '../render.js'
import { type Theme, traits } from '../traits.js'

/** The smallest size the animated Flungie is used at: below it the WebGL body is not worth its cost. */
export const ANIMATED_MIN_SIZE = 160

export interface FlungieProps extends Omit<FlungieOptions, 'id' | 'layers'> {
  /** A stable ID for the person or thing: a user ID, not an email that may change. */
  seed: string
  /** Breathes and blinks, in WebGL, at ANIMATED_MIN_SIZE and up. Still under prefers-reduced-motion. */
  animated?: boolean | undefined
  className?: string | undefined
  style?: CSSProperties | undefined
}

export function Flungie({ seed, size = 64, theme = 'light', variant = 'disc', animated = false, className, style, ...rest }: FlungieProps) {
  const reactId = useId()
  const config = JSON.stringify([rest.overrides, rest.salt, rest.palette, rest.accessories])
  // config is the serialised form of the options traits() reads, so a new object with the same values is no change.
  const t = useMemo(() => traits(seed, rest.overrides, rest), [seed, config])
  const svg = useMemo(() => render(t, { size, theme, variant, texture: rest.texture, ground: rest.ground, palette: rest.palette, id: reactId }), [t, size, theme, variant, rest.texture, rest.ground, rest.palette, reactId])
  const gl = animated && size >= ANIMATED_MIN_SIZE
  const host = useRef<HTMLDivElement>(null)
  const hero = useRef<FlungieGL | null>(null)
  const [mounted, setMounted] = useState(false)
  const latest = useRef({ size, theme, variant })
  latest.current = { size, theme, variant }

  useEffect(() => {
    if (!gl || !host.current) return
    let cancelled = false
    const el = host.current
    import('../gl/index.js').then(({ mountFlungieGL }) => {
      if (cancelled) return
      hero.current = mountFlungieGL(el, t, { ...latest.current, palette: rest.palette })
      setMounted(true)
    })
    return () => {
      cancelled = true
      hero.current?.dispose()
      hero.current = null
      setMounted(false)
    }
    // Theme, size and variant are applied below, without a remount.
  }, [gl, t])

  useEffect(() => {
    hero.current?.setTheme(theme as Theme)
  }, [theme])
  useEffect(() => {
    hero.current?.setSize(size)
  }, [size])
  useEffect(() => {
    hero.current?.update(t, { variant })
  }, [variant])

  const box: CSSProperties = { display: 'inline-block', position: 'relative', width: size, height: size, lineHeight: 0, flex: 'none', ...style }
  if (!gl) return <span className={className} style={box} dangerouslySetInnerHTML={{ __html: svg }} />
  return (
    <span className={className} style={box}>
      {mounted ? null : <span style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />}
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
    </span>
  )
}
