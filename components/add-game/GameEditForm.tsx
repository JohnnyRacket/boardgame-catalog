'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUploadField } from './ImageUploadField'
import { RulebookUploadField } from './RulebookUploadField'
import { GenreTagInput } from './GenreTagInput'
import { updateGameAction, type ActionState } from '@/lib/actions/games'
import type { Game } from '@/lib/db/types'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

interface GameEditFormProps {
  game: Game
  genres: string[]
}

export function GameEditForm({ game, genres }: GameEditFormProps) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateGameAction,
    {}
  )

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="game_id" value={game.id} />

      {state.message && !state.errors && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Info</h2>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={game.name} />
            <FieldError errors={state.errors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year_published">Year Published</Label>
            <Input
              id="year_published"
              name="year_published"
              type="number"
              min={1900}
              max={2100}
              defaultValue={game.year_published ?? ''}
            />
            <FieldError errors={state.errors?.year_published} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publisher">Publisher</Label>
            <Input id="publisher" name="publisher" defaultValue={game.publisher ?? ''} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="designer">Designer</Label>
            <Input id="designer" name="designer" defaultValue={game.designer ?? ''} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={game.description ?? ''}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <FieldError errors={state.errors?.description} />
        </div>

        <ImageUploadField initialUrl={game.image_url ?? undefined} />
        <RulebookUploadField initialUrl={game.rulebook_url ?? undefined} />
      </section>

      {/* Play Details */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Play Details</h2>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="min_players">
              Min Players <span className="text-destructive">*</span>
            </Label>
            <Input
              id="min_players"
              name="min_players"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={game.min_players}
            />
            <FieldError errors={state.errors?.min_players} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_players">
              Max Players <span className="text-destructive">*</span>
            </Label>
            <Input
              id="max_players"
              name="max_players"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={game.max_players}
            />
            <FieldError errors={state.errors?.max_players} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="min_play_time">Min Play Time (min)</Label>
            <Input
              id="min_play_time"
              name="min_play_time"
              type="number"
              min={1}
              defaultValue={game.min_play_time ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_play_time">Max Play Time (min)</Label>
            <Input
              id="max_play_time"
              name="max_play_time"
              type="number"
              min={1}
              defaultValue={game.max_play_time ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="min_age">Min Age</Label>
            <Input
              id="min_age"
              name="min_age"
              type="number"
              min={0}
              max={99}
              defaultValue={game.min_age ?? ''}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="complexity">Complexity</Label>
            <Select name="complexity" defaultValue={game.complexity?.toString() ?? undefined}>
              <SelectTrigger id="complexity">
                <SelectValue placeholder="Select complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 – Easy</SelectItem>
                <SelectItem value="2">2 – Light</SelectItem>
                <SelectItem value="3">3 – Medium</SelectItem>
                <SelectItem value="4">4 – Heavy</SelectItem>
                <SelectItem value="5">5 – Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="player_interaction">Player Interaction</Label>
            <Select name="player_interaction" defaultValue={game.player_interaction ?? undefined}>
              <SelectTrigger id="player_interaction">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cooperative">Cooperative</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Genres</h2>
        <Separator />
        <GenreTagInput genres={genres} initialSelected={game.genres ?? []} />
      </section>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
