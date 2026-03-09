import { filterSearchParamsCache } from '@/lib/validations/filters'
import { getFilteredGames, getGenres, getGameById } from '@/lib/db/queries'
import { isAuthenticated } from '@/lib/auth'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { GameGrid } from '@/components/catalog/GameGrid'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Pagination } from '@/components/catalog/Pagination'
import { GameModal } from '@/components/catalog/GameModal'

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>
}

export default async function GamesPage({ searchParams }: PageProps) {
  const rawParams = await searchParams
  const gameId = rawParams.game ? Number(rawParams.game) : null
  const filters = await filterSearchParamsCache.parse(rawParams)

  const [{ games, total, totalPages, page }, genres, selectedGame, authenticated] = await Promise.all([
    getFilteredGames(filters),
    getGenres(),
    gameId ? getGameById(gameId) : Promise.resolve(null),
    isAuthenticated(),
  ])

  return (
    <div className="flex gap-8">
      <div className="hidden lg:block">
        <FilterSidebar genres={genres} />
      </div>
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        <CatalogHeader total={total} genres={genres} />
        <GameGrid games={games} authenticated={authenticated} />
        <Pagination page={page} totalPages={totalPages} />
      </div>
      {selectedGame && <GameModal game={selectedGame} authenticated={authenticated} />}
    </div>
  )
}
