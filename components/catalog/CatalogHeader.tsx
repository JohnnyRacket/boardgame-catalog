import { FilterSheet } from './FilterSheet'
import { SortSelect } from './SortSelect'
import { FilterBar } from './FilterBar'
import { SearchBar } from './SearchBar'
import {
  ClearFiltersButtonDesktop,
  ClearFiltersButtonMobile,
} from './ClearFiltersButton'

interface CatalogHeaderProps {
  total: number
  genres: string[]
}

export function CatalogHeader({ total, genres }: CatalogHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Mobile-only full-width clear all — shown above search when filters are active */}
      <div className="lg:hidden">
        <ClearFiltersButtonMobile />
      </div>
      <SearchBar />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FilterSheet genres={genres} />
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'game' : 'games'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop-only clear all — sits left of sort dropdown */}
          <div className="hidden lg:flex">
            <ClearFiltersButtonDesktop />
          </div>
          <SortSelect />
        </div>
      </div>
      <FilterBar />
    </div>
  )
}
