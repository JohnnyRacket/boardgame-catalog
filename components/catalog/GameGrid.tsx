import { GameCard } from './GameCard'
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
          Try adjusting your filters or{' '}
          <a href="/add" className="underline underline-offset-4">
            add a game
          </a>
          .
        </p>
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
