'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Brain, Clock, Crown, Pencil, Star } from 'lucide-react'
import { useQueryState, parseAsInteger } from 'nuqs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InteractionBadge } from '@/components/shared/InteractionBadge'
import { PlayerCount } from '@/components/shared/PlayerCount'
import { COMPLEXITY_LABELS } from '@/lib/constants'
import type { Game } from '@/lib/db/types'

interface GameCardProps {
  authenticated: boolean
  game: Game
}

export function GameCard({ game, authenticated }: GameCardProps) {
  const [, setGame] = useQueryState('game', parseAsInteger.withOptions({ shallow: false }))

  const playTime =
    game.min_play_time && game.max_play_time
      ? game.min_play_time === game.max_play_time
        ? `${game.min_play_time}m`
        : `${game.min_play_time}–${game.max_play_time}m`
      : game.min_play_time
        ? `${game.min_play_time}m`
        : null

  return (
    <div className="relative group">
      <div className="block cursor-pointer" onClick={() => setGame(game.id)}>
        <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md h-full py-0 gap-0">
          <div className="mx-3 mt-3 rounded-lg overflow-hidden">
            <div className="relative aspect-[3/2] bg-muted">
              {game.image_url ? (
                <Image
                  src={game.image_url}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <span className="text-4xl">🎲</span>
                </div>
              )}
            </div>
          </div>

          <CardHeader className="px-3 pt-2 pb-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight line-clamp-2">{game.name}</h3>
              {game.user_rating && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {Number(game.user_rating).toFixed(1)}
                </span>
              )}
            </div>
            {game.year_published && (
              <p className="text-xs text-muted-foreground">{game.year_published}</p>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-2 px-3 pt-2 pb-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <PlayerCount min={game.min_players} max={game.max_players} />
              {game.best_with && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  {game.best_with}
                </span>
              )}
              {playTime && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {playTime}
                </span>
              )}
              {game.complexity && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Brain className="h-3.5 w-3.5" />
                  {COMPLEXITY_LABELS[game.complexity]}
                </span>
              )}
            </div>

            {game.player_interaction && (
              <div className="flex flex-wrap gap-1">
                <InteractionBadge interaction={game.player_interaction} />
              </div>
            )}

            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {game.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {authenticated && (
        <Link
          href={`/games/${game.id}/edit`}
          className="absolute top-2 right-2 z-10 rounded-md bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          aria-label="Edit game"
        >
          <Pencil className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
