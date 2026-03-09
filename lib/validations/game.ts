import { z } from 'zod'

export const addGameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(5000).optional(),
  image_url: z.string().max(1024).optional().or(z.literal('')),
  rulebook_url: z.string().max(1024).optional().or(z.literal('')),
  year_published: z.coerce.number().int().min(1900).max(2100).optional(),
  publisher: z.string().max(255).optional(),
  designer: z.string().max(255).optional(),
  min_players: z.coerce.number().int().min(1).max(20),
  max_players: z.coerce.number().int().min(1).max(20),
  min_age: z.coerce.number().int().min(0).max(99).optional(),
  min_play_time: z.coerce.number().int().min(1).max(9999).optional(),
  max_play_time: z.coerce.number().int().min(1).max(9999).optional(),
  complexity: z.coerce.number().int().min(1).max(5).optional(),
  player_interaction: z
    .enum(['cooperative', 'competitive', 'teams'])
    .optional(),
  best_with: z.coerce.number().int().min(1).max(20).optional(),
  genres: z.array(z.string()).optional(),
  user_rating: z.coerce.number().min(1).max(10).optional(),
})

export type AddGameInput = z.infer<typeof addGameSchema>
