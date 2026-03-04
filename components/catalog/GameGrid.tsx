import { GameCard } from './GameCard'
import { AddGameButton } from '@/components/shared/AddGameButton'
import type { Game } from '@/lib/db/types'

interface GameGridProps {
  games: Game[]
}

export function GameGrid({ games }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-6xl">🎲</span>
        <h3 className="mt-4 text-xl font-semibold">No games found</h3>
        <p className="mt-2 text-muted-foreground">
          Try adjusting your filters or add a game below.
        </p>
        <div className="mt-4">
          <AddGameButton />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}
