import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  parseAsFloat,
  createSearchParamsCache,
} from 'nuqs/server'
import { SORT_OPTIONS } from '@/lib/constants'

const sortValues = SORT_OPTIONS.map((o) => o.value)

export const filterParsers = {
  q: parseAsString.withDefault(''),
  genres: parseAsArrayOf(parseAsString).withDefault([]),
  interaction: parseAsString.withDefault(''),
  players: parseAsInteger,
  complexity_min: parseAsInteger.withDefault(1),
  complexity_max: parseAsInteger.withDefault(5),
  play_time: parseAsInteger,
  rating_min: parseAsFloat,
  sort: parseAsString.withDefault('name_asc'),
  page: parseAsInteger.withDefault(1),
}

export const filterSearchParamsCache = createSearchParamsCache(filterParsers)

export type FilterValues = {
  q: string
  genres: string[]
  interaction: string
  players: number | null
  complexity_min: number
  complexity_max: number
  play_time: number | null
  rating_min: number | null
  sort: string
  page: number
}
