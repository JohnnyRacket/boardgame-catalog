export const COMPLEXITY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Light',
  3: 'Medium',
  4: 'Heavy',
  5: 'Expert',
}

export const INTERACTION_LABELS: Record<string, string> = {
  cooperative: 'Cooperative',
  competitive: 'Competitive',
  teams: 'Teams',
}

export const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'rating_desc', label: 'Top Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'year_desc', label: 'Newest' },
  { value: 'year_asc', label: 'Oldest' },
  { value: 'time_asc', label: 'Shortest' },
  { value: 'time_desc', label: 'Longest' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']
