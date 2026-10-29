/**
 * What `demo:shot --probe` measures (from Plotwork's demo tool; an element with a shadow root, such as the panel, counts as
 * something seen, as the probe cannot look inside it) in a page, as text the page evaluates (the tools are typed for Node, with no browser globals):
 * how tall the page is against the bottom of what can be seen, what reaches below that bottom (leaving out the boxes that hold
 * something seen, whose padding is not the fault), what runs past the window's right edge, and text wider than its own box. An
 * element inside a box that clips it does not count, as it cannot be seen there.
 */

export interface ProbeReport {
  pageHeight: number
  contentBottom: number
  windowWidth: number
  windowHeight: number
  /** What makes the page taller than what can be seen, lowest first. */
  belowContent: string[]
  /** What reaches past the window's right edge. */
  pastRightEdge: string[]
  /** Text wider than the box it is in, which it overflows. */
  textOverflow: string[]
}

/** How far below what can be seen a page may end before the probe says so: a page's own bottom padding is about this. */
export const PROBE_GAP = 96

export const PROBE = `(() => {
  const GAP = ${PROBE_GAP}
  const name = (el) => {
    const id = el.id ? '#' + el.id : ''
    const cls = typeof el.className === 'string' && el.className.trim() !== '' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''
    const text = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40)
    return el.tagName.toLowerCase() + id + cls + (text === '' ? '' : ' "' + text + '"')
  }
  const clipped = (el) => {
    for (let node = el.parentElement; node !== null && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible' || style.contain.includes('paint')) return true
    }
    return false
  }
  const seen = (el, box) => {
    const style = getComputedStyle(el)
    if (style.visibility !== 'visible' || Number(style.opacity) === 0 || box.width < 2 || box.height < 2) return false
    const own = Array.from(el.childNodes).some((node) => node.nodeType === 3 && node.textContent.trim() !== '')
    return own || el.shadowRoot !== null || el.matches('img, svg, video, canvas, input, textarea, select, button, hr, [role="img"]')
  }
  const all = Array.from(document.querySelectorAll('body *'))
  let contentBottom = 0
  const holders = new Set()
  const boxes = all.map((el) => {
    const box = el.getBoundingClientRect()
    const bottom = box.bottom + window.scrollY
    if (seen(el, box)) {
      contentBottom = Math.max(contentBottom, bottom)
      for (let node = el.parentElement; node !== null && !holders.has(node); node = node.parentElement) holders.add(node)
    }
    return { el, box, bottom }
  })
  const pageHeight = document.scrollingElement ? document.scrollingElement.scrollHeight : 0
  const width = document.documentElement.clientWidth
  const below = boxes
    .filter(({ el, box, bottom }) => box.height > 0 && bottom > contentBottom + 4 && !holders.has(el) && (!clipped(el) || ['absolute', 'fixed'].includes(getComputedStyle(el).position)))
    .sort((a, b) => b.bottom - a.bottom)
    .slice(0, 8)
    .map(({ el, box, bottom }) => name(el) + ' bottom ' + Math.round(bottom) + ' height ' + Math.round(box.height) + ' ' + getComputedStyle(el).position)
  const past = boxes
    .filter(({ el, box }) => box.width > 0 && box.right > width + 1 && !clipped(el) && getComputedStyle(el).position !== 'fixed')
    .slice(0, 8)
    .map(({ el, box }) => name(el) + ' right ' + Math.round(box.right) + ' of ' + width)
  const text = boxes
    .filter(({ el, box }) => box.width > 0 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && getComputedStyle(el).display !== 'inline' && Array.from(el.childNodes).some((node) => node.nodeType === 3 && node.textContent.trim() !== ''))
    .slice(0, 8)
    .map(({ el }) => name(el) + ' text ' + el.scrollWidth + ' wide in ' + el.clientWidth)
  return { pageHeight, contentBottom: Math.round(contentBottom), windowWidth: width, windowHeight: window.innerHeight, belowContent: pageHeight > Math.max(contentBottom + GAP, window.innerHeight) ? below : [], pastRightEdge: past, textOverflow: text }
})()`

/** The probe's report as lines to print, or none when nothing is wrong. */
export function probeLines(report: ProbeReport): string[] {
  const lines: string[] = []
  const gap = report.pageHeight - report.contentBottom
  if (gap > PROBE_GAP && report.pageHeight > report.windowHeight) lines.push(`page is ${report.pageHeight} px tall, ${gap} px below the last thing that can be seen (${report.contentBottom})`, ...report.belowContent.map((one) => `  below: ${one}`))
  for (const one of report.pastRightEdge) lines.push(`past the right edge: ${one}`)
  for (const one of report.textOverflow) lines.push(`text overflows: ${one}`)
  return lines
}
