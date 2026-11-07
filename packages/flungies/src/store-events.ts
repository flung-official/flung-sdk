/**
 * When each of the year's events is on: the days it runs, and whether its items are sold the rest of the year too. A shelf
 * features an event's items while it is on, and an event that is limited sells its items only then. A service keeps its own
 * changes (staff moving Easter to this year's date, or keeping Christmas on all year) and passes them in, as with prices.
 *
 * Days are month and day, `MM-DD`, the same every year, in UTC. A window may run over the new year (`12-26` to `01-07`). An event
 * may have other days in the southern hemisphere (summer is December there); a person's hemisphere follows their country.
 */
import { STORE_EVENTS, type StoreEvent, type StoreItem } from './store.js'

/** `MM-DD`, from 01-01 to 12-31. */
export type MonthDay = string

/** Which half of the world a person is in, for the seasons. */
export type Hemisphere = 'north' | 'south'
export const HEMISPHERES: readonly Hemisphere[] = ['north', 'south']

/** An event's days in one hemisphere. */
export interface SeasonDays {
  start: MonthDay
  end: MonthDay
}

export interface EventSeason {
  /** First day it is on, or null for an event with no time of year (a birthday): never featured, sold all year. */
  start: MonthDay | null
  /** Last day it is on, inclusive. */
  end: MonthDay | null
  /** Its days in the southern hemisphere, or null for the same days as the north (holidays). */
  south: SeasonDays | null
  /** Its items are sold all year, featured only while it is on. Off: they are on the shelf only then. */
  allYear: boolean
}

/** What a service may change about an event's season. Anything left out keeps the default. */
export type EventSeasonOverride = Partial<EventSeason>

/**
 * The defaults. Holidays are limited to their weeks, so their items come and go, on the same days in both hemispheres; the
 * seasons are featured in their months, six months apart in the south, and sold all year, so a plain jumper or a sundress is
 * not taken away. Easter moves: its window covers every date it can fall on, for staff to narrow each year.
 */
export const DEFAULT_EVENT_SEASONS: Readonly<Record<StoreEvent, EventSeason>> = {
  newYear: { start: '12-26', end: '01-07', south: null, allYear: false },
  lunarNewYear: { start: '01-20', end: '02-20', south: null, allYear: false },
  valentines: { start: '02-01', end: '02-15', south: null, allYear: false },
  stPatricks: { start: '03-10', end: '03-18', south: null, allYear: false },
  easter: { start: '03-20', end: '04-26', south: null, allYear: false },
  halloween: { start: '10-01', end: '11-02', south: null, allYear: false },
  christmas: { start: '12-01', end: '12-26', south: null, allYear: false },
  spring: { start: '03-01', end: '05-31', south: { start: '09-01', end: '11-30' }, allYear: true },
  summer: { start: '06-01', end: '08-31', south: { start: '12-01', end: '02-28' }, allYear: true },
  autumn: { start: '09-01', end: '11-30', south: { start: '03-01', end: '05-31' }, allYear: true },
  winter: { start: '12-01', end: '02-28', south: { start: '06-01', end: '08-31' }, allYear: true },
  birthday: { start: null, end: null, south: null, allYear: true },
}

/** Names for the events, for a shelf's headings. */
export const EVENT_LABELS: Readonly<Record<StoreEvent, string>> = {
  newYear: 'New Year',
  lunarNewYear: 'Lunar New Year',
  valentines: "Valentine's Day",
  stPatricks: "St Patrick's Day",
  easter: 'Easter',
  halloween: 'Halloween',
  christmas: 'Christmas',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
  birthday: 'Birthday',
}

/**
 * Countries mostly south of the equator (ISO 3166-1 alpha-2), whose people get the southern seasons. Countries the equator
 * runs through count by where most of their people live.
 */
export const SOUTHERN_COUNTRIES: ReadonlySet<string> = new Set([
  'AO', 'AR', 'AU', 'BI', 'BO', 'BR', 'BW', 'CD', 'CK', 'CL', 'FJ', 'ID', 'KM', 'LS', 'MG', 'MU', 'MW', 'MZ', 'NA', 'NC', 'NU',
  'NZ', 'PE', 'PF', 'PG', 'PY', 'RE', 'RW', 'SB', 'SC', 'SZ', 'TL', 'TO', 'TZ', 'UY', 'VU', 'WS', 'YT', 'ZA', 'ZM', 'ZW',
])

/** The hemisphere of a country code, `AU` or `nz`; the north for one not known or none. */
export function hemisphereOf(country: string | null | undefined): Hemisphere {
  return country != null && SOUTHERN_COUNTRIES.has(country.toUpperCase()) ? 'south' : 'north'
}

/** A season's days in a hemisphere, or null for one with no days. */
export function seasonDays(season: EventSeason, hemisphere: Hemisphere = 'north'): SeasonDays | null {
  if (hemisphere === 'south' && season.south !== null) return season.south
  return season.start === null || season.end === null ? null : { start: season.start, end: season.end }
}

const MONTH_DAY = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Whether `value` is a real `MM-DD` (02-29 counts; it is passed over in other years). */
export function isMonthDay(value: string): boolean {
  const match = MONTH_DAY.exec(value)
  if (match === null) return false
  return Number(match[2]) <= (DAYS_IN[Number(match[1]) - 1] as number)
}

/** The seasons as a service runs them: the defaults with its overrides laid over them. Unknown events are ignored. */
export function eventSeasons(overrides: Readonly<Partial<Record<string, EventSeasonOverride>>> = {}): Record<StoreEvent, EventSeason> {
  const out = {} as Record<StoreEvent, EventSeason>
  for (const event of STORE_EVENTS) out[event] = { ...DEFAULT_EVENT_SEASONS[event], ...(overrides[event] ?? {}) }
  return out
}

const monthDayOf = (at: Date): MonthDay => `${String(at.getUTCMonth() + 1).padStart(2, '0')}-${String(at.getUTCDate()).padStart(2, '0')}`

/** Whether a season is on at `at` in a hemisphere. One with no days is never on. */
export function seasonOn(season: EventSeason, at: Date, hemisphere: Hemisphere = 'north'): boolean {
  const days = seasonDays(season, hemisphere)
  if (days === null) return false
  const day = monthDayOf(at)
  return days.start <= days.end ? day >= days.start && day <= days.end : day >= days.start || day <= days.end
}

/** The events on at `at` in a hemisphere, in STORE_EVENTS order. */
export function eventsOn(seasons: Readonly<Record<StoreEvent, EventSeason>>, at: Date, hemisphere: Hemisphere = 'north'): StoreEvent[] {
  return STORE_EVENTS.filter((event) => seasonOn(seasons[event], at, hemisphere))
}

/**
 * The next time a season starts after `at`, as a UTC midnight, or null for one with no days. Today counts when it starts today,
 * so a shelf can say when an event's items are back.
 */
export function nextStart(season: EventSeason, at: Date, hemisphere: Hemisphere = 'north'): Date | null {
  const days = seasonDays(season, hemisphere)
  if (days === null) return null
  const [month, day] = days.start.split('-').map(Number) as [number, number]
  for (let year = at.getUTCFullYear(); year <= at.getUTCFullYear() + 8; year++) {
    const start = new Date(Date.UTC(year, month - 1, day))
    // 02-29 in a year without one rolls into March: skip to a year that has it.
    if (start.getUTCMonth() !== month - 1) continue
    if (start.getTime() >= Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate())) return start
  }
  return null
}

/** Whether an item is in season at `at` in a hemisphere: one with no event, or an event sold all year, always is. */
export function inSeason(item: Pick<StoreItem, 'event'>, seasons: Readonly<Record<StoreEvent, EventSeason>>, at: Date, hemisphere: Hemisphere = 'north'): boolean {
  if (item.event === undefined) return true
  const season = seasons[item.event]
  return season.allYear || seasonOn(season, at, hemisphere)
}

/**
 * The shelf at `at` for a person in `hemisphere`: items out of season switched off (so `availability` says 'off' and owned ones stay wearable), and the
 * events on now with their items, for a featured shelf, most specific first: holidays before the seasons they fall in.
 */
export function seasonalShelf<T extends StoreItem>(
  items: readonly T[],
  seasons: Readonly<Record<StoreEvent, EventSeason>>,
  at: Date,
  hemisphere: Hemisphere = 'north',
): { items: T[]; featured: { event: StoreEvent; label: string; end: MonthDay; items: T[] }[] } {
  const shelf = items.map((item) => (item.enabled && !inSeason(item, seasons, at, hemisphere) ? { ...item, enabled: false } : item))
  const on = eventsOn(seasons, at, hemisphere).sort((a, b) => Number(seasons[a].allYear) - Number(seasons[b].allYear))
  const featured = on
    .map((event) => ({ event, label: EVENT_LABELS[event], end: (seasonDays(seasons[event], hemisphere) as SeasonDays).end, items: shelf.filter((item) => item.event === event && item.enabled) }))
    .filter((group) => group.items.length > 0)
  return { items: shelf, featured }
}
