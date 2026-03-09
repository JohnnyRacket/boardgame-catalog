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
import { addGameAction, type ActionState } from '@/lib/actions/games'
import type { BggGameData } from '@/lib/types/bgg'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}

interface AddGameFormProps {
  genres: string[]
  defaultValues?: BggGameData
}

export function AddGameForm({ genres, defaultValues }: AddGameFormProps) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    addGameAction,
    {}
  )

  return (
    <form action={action} className="space-y-8">
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
            <Input id="name" name="name" required defaultValue={defaultValues?.name ?? ''} />
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
              defaultValue={defaultValues?.year_published ?? ''}
            />
            <FieldError errors={state.errors?.year_published} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publisher">Publisher</Label>
            <Input id="publisher" name="publisher" defaultValue={defaultValues?.publisher ?? ''} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="designer">Designer</Label>
            <Input id="designer" name="designer" defaultValue={defaultValues?.designer ?? ''} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={defaultValues?.description ?? ''}
          />
          <FieldError errors={state.errors?.description} />
        </div>

        <ImageUploadField initialUrl={defaultValues?.image_url} />
        <RulebookUploadField />
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
              defaultValue={defaultValues?.min_players ?? 1}
              required
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
              defaultValue={defaultValues?.max_players ?? 4}
              required
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
              defaultValue={defaultValues?.min_play_time ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_play_time">Max Play Time (min)</Label>
            <Input
              id="max_play_time"
              name="max_play_time"
              type="number"
              min={1}
              defaultValue={defaultValues?.max_play_time ?? ''}
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
              defaultValue={defaultValues?.min_age ?? ''}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user_rating">Rating (1–10)</Label>
            <Input
              id="user_rating"
              name="user_rating"
              type="number"
              min={1}
              max={10}
              step={0.1}
              defaultValue={defaultValues?.bgg_rating ?? ''}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="complexity">Complexity</Label>
            <Select name="complexity" defaultValue={defaultValues?.complexity?.toString()}>
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
            <Select name="player_interaction">
              <SelectTrigger id="player_interaction">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cooperative">Cooperative</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="teams">Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="best_with">Best With (players)</Label>
            <Input
              id="best_with"
              name="best_with"
              type="number"
              min={1}
              max={20}
              defaultValue={defaultValues?.best_with ?? ''}
            />
            <FieldError errors={state.errors?.best_with} />
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Genres</h2>
        <Separator />
        <GenreTagInput genres={genres} initialSelected={defaultValues?.genres ?? []} />
      </section>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Adding…' : 'Add Game'}
      </Button>
    </form>
  )
}
