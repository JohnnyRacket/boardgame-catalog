import { FilterSheet } from './FilterSheet'
import { SortSelect } from './SortSelect'
import { FilterBar } from './FilterBar'
import { SearchBar } from './SearchBar'

interface CatalogHeaderProps {
  total: number
  genres: string[]
}

export function CatalogHeader({ total, genres }: CatalogHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <SearchBar />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FilterSheet genres={genres} />
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'game' : 'games'}
          </span>
        </div>
        <SortSelect />
      </div>
      <FilterBar />
    </div>
  )
}
