import { describe, expect, it } from 'vitest'

import { DEFAULT_STORE, STORE_EVENTS } from '../store.js'
import { DEFAULT_EVENT_SEASONS, EVENT_LABELS, eventSeasons, eventsOn, hemisphereOf, inSeason, isMonthDay, nextStart, seasonalShelf, seasonDays, seasonOn } from '../store-events.js'

const at = (iso: string) => new Date(`${iso}T12:00:00Z`)

describe('event seasons', () => {
  it('has a default season and a label for every event', () => {
    for (const event of STORE_EVENTS) {
      expect(DEFAULT_EVENT_SEASONS[event]).toBeDefined()
      expect(EVENT_LABELS[event]).toBeTruthy()
      const { start, end, south } = DEFAULT_EVENT_SEASONS[event]
      if (start !== null) expect(isMonthDay(start)).toBe(true)
      if (end !== null) expect(isMonthDay(end)).toBe(true)
      if (south !== null) expect(isMonthDay(south.start) && isMonthDay(south.end)).toBe(true)
    }
  })

  it('reads month-days strictly', () => {
    expect(isMonthDay('02-29')).toBe(true)
    expect(isMonthDay('02-30')).toBe(false)
    expect(isMonthDay('13-01')).toBe(false)
    expect(isMonthDay('4-01')).toBe(false)
  })

  it('is on inside its days, the last included, and runs over the new year', () => {
    const seasons = eventSeasons()
    expect(seasonOn(seasons.halloween, at('2026-10-31'))).toBe(true)
    expect(seasonOn(seasons.halloween, at('2026-11-02'))).toBe(true)
    expect(seasonOn(seasons.halloween, at('2026-11-03'))).toBe(false)
    expect(seasonOn(seasons.newYear, at('2026-12-31'))).toBe(true)
    expect(seasonOn(seasons.newYear, at('2027-01-03'))).toBe(true)
    expect(seasonOn(seasons.newYear, at('2027-01-08'))).toBe(false)
    expect(seasonOn(seasons.birthday, at('2026-06-01'))).toBe(false)
    expect(eventsOn(seasons, at('2026-12-10'))).toEqual(['christmas', 'winter'])
  })

  it('takes overrides field by field', () => {
    const seasons = eventSeasons({ easter: { start: '04-01', end: '04-06' }, christmas: { allYear: true }, nope: { allYear: true } })
    expect(seasons.easter).toEqual({ start: '04-01', end: '04-06', south: null, allYear: false })
    expect(seasons.christmas.allYear).toBe(true)
    expect(seasons.christmas.start).toBe('12-01')
    expect(Object.keys(seasons)).toHaveLength(STORE_EVENTS.length)
  })

  it('says when a season is next on', () => {
    const seasons = eventSeasons()
    expect(nextStart(seasons.christmas, at('2026-11-07'))?.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(nextStart(seasons.halloween, at('2026-11-07'))?.toISOString()).toBe('2027-10-01T00:00:00.000Z')
    expect(nextStart(seasons.christmas, at('2026-12-01'))?.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(nextStart({ start: '02-29', end: '03-01', south: null, allYear: false }, at('2026-03-05'))?.toISOString()).toBe('2028-02-29T00:00:00.000Z')
    expect(nextStart(seasons.birthday, at('2026-11-07'))).toBeNull()
  })

  it('takes limited items off the shelf out of season and features the ones on, holidays first', () => {
    const seasons = eventSeasons()
    const santa = DEFAULT_STORE.find((item) => item.id === 'outfit:santa')
    const scarf = DEFAULT_STORE.find((item) => item.id === 'outfit:scarf')
    expect(santa && inSeason(santa, seasons, at('2026-07-01'))).toBe(false)
    expect(scarf && inSeason(scarf, seasons, at('2026-07-01'))).toBe(true)

    const summer = seasonalShelf(DEFAULT_STORE, seasons, at('2026-07-01'))
    expect(summer.items.find((item) => item.id === 'outfit:santa')?.enabled).toBe(false)
    expect(summer.items.find((item) => item.id === 'outfit:jumper')?.enabled).toBe(true)
    expect(summer.featured.map((group) => group.event)).toEqual(['summer'])

    const december = seasonalShelf(DEFAULT_STORE, seasons, at('2026-12-10'))
    expect(december.featured.map((group) => group.event)).toEqual(['christmas', 'winter'])
    expect(december.featured[0]?.items.some((item) => item.id === 'outfit:santa')).toBe(true)
    expect(december.featured[0]?.end).toBe('12-26')
  })

  it('leaves an item staff switched off out of the featured shelf', () => {
    const items = DEFAULT_STORE.map((item) => (item.id === 'outfit:santa' ? { ...item, enabled: false } : item))
    const december = seasonalShelf(items, eventSeasons(), at('2026-12-10'))
    expect(december.featured[0]?.items.some((item) => item.id === 'outfit:santa')).toBe(false)
  })

  it('runs the seasons six months apart in the south and the holidays on the same days', () => {
    const seasons = eventSeasons()
    expect(eventsOn(seasons, at('2026-12-10'), 'south')).toEqual(['christmas', 'summer'])
    expect(eventsOn(seasons, at('2026-07-01'), 'south')).toEqual(['winter'])
    expect(seasonDays(seasons.halloween, 'south')).toEqual({ start: '10-01', end: '11-02' })
    expect(seasonDays(seasons.birthday, 'south')).toBeNull()
    expect(nextStart(seasons.summer, at('2026-11-07'), 'south')?.toISOString()).toBe('2026-12-01T00:00:00.000Z')

    const december = seasonalShelf(DEFAULT_STORE, seasons, at('2026-12-10'), 'south')
    expect(december.featured.map((group) => group.event)).toEqual(['christmas', 'summer'])
    expect(december.featured[1]?.end).toBe('02-28')

    const moved = eventSeasons({ summer: { south: { start: '11-15', end: '02-15' } } })
    expect(seasonOn(moved.summer, at('2026-11-20'), 'south')).toBe(true)
    expect(seasonOn(moved.summer, at('2026-11-20'), 'north')).toBe(false)
  })

  it('takes a hemisphere from a country', () => {
    expect(hemisphereOf('AU')).toBe('south')
    expect(hemisphereOf('nz')).toBe('south')
    expect(hemisphereOf('GB')).toBe('north')
    expect(hemisphereOf(null)).toBe('north')
  })
})
