import Image from 'next/image'
import { Brain, Clock, Users, Calendar, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { COMPLEXITY_LABELS } from '@/lib/constants'
import { InteractionBadge } from '@/components/shared/InteractionBadge'
import { RatingEditor } from '@/components/catalog/RatingEditor'
import { RulesSummarySection } from '@/components/catalog/RulesSummarySection'
import type { Game } from '@/lib/db/types'

interface GameDetailContentProps {
  game: Game
}

export function GameDetailContent({ game }: GameDetailContentProps) {
  const playTime =
    game.min_play_time && game.max_play_time
      ? game.min_play_time === game.max_play_time
        ? `${game.min_play_time} min`
        : `${game.min_play_time}–${game.max_play_time} min`
      : game.min_play_time
        ? `${game.min_play_time} min`
        : null

  const players =
    game.min_players === game.max_players
      ? `${game.min_players}`
      : `${game.min_players}–${game.max_players}`

  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full min-w-0">
      {/* Image */}
      <div className="relative shrink-0 w-full sm:w-[40%] aspect-[4/3] rounded-lg overflow-hidden bg-muted">
        {game.image_url ? (
          <Image
            src={game.image_url}
            alt={game.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 40vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-6xl">🎲</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        <div>
          <h2 className="text-xl font-bold leading-tight">{game.name}</h2>
          <div className="flex items-center gap-3 mt-0.5">
            {game.year_published && (
              <p className="text-sm text-muted-foreground">{game.year_published}</p>
            )}
            {game.user_rating && (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(game.user_rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {players} players
          </span>
          {playTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {playTime}
            </span>
          )}
          {game.min_age && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Age {game.min_age}+
            </span>
          )}
          {game.complexity && (
            <span className="flex items-center gap-1.5">
              <Brain className="h-4 w-4" />
              {COMPLEXITY_LABELS[game.complexity]}
            </span>
          )}
        </div>

        {(game.publisher || game.designer) && (
          <div className="flex flex-col gap-1 text-sm">
            {game.publisher && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Publisher:</span> {game.publisher}
              </span>
            )}
            {game.designer && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Designer:</span> {game.designer}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {game.player_interaction && <InteractionBadge interaction={game.player_interaction} />}
        </div>

        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {game.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
        )}

        <div className="mt-auto pt-2 border-t space-y-3">
          <RulesSummarySection
            gameId={game.id}
            gameName={game.name}
            rulebookUrl={game.rulebook_url ?? null}
            initialSummary={game.rules_summary ?? null}
          />
          {/* <RatingEditor game={game} /> */}
        </div>
      </div>
    </div>
  )
}
