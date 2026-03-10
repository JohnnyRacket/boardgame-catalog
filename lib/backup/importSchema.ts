import { z } from 'zod'

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(min).max(max).optional()
  )

const optionalFloat = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(min).max(max).optional()
  )

const optionalStr = (maxLen = 5000) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.string().max(maxLen).optional())

export const importRowSchema = z.object({
  name: z.string().min(1).max(255),
  description: optionalStr(),
  image_url: optionalStr(1024),
  rulebook_url: optionalStr(1024),
  rules_summary: optionalStr(),
  year_published: optionalInt(1900, 2100),
  publisher: optionalStr(255),
  designer: optionalStr(255),
  min_players: z.preprocess((v) => Number(v), z.number().int().min(1).max(20)),
  max_players: z.preprocess((v) => Number(v), z.number().int().min(1).max(20)),
  min_age: optionalInt(0, 99),
  min_play_time: optionalInt(1, 9999),
  max_play_time: optionalInt(1, 9999),
  complexity: optionalInt(1, 5),
  player_interaction: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['cooperative', 'competitive', 'teams']).optional()
  ),
  best_with: optionalInt(1, 20),
  genres: z.preprocess(
    (v) => (v === '' || v == null ? [] : String(v).split('|').filter(Boolean)),
    z.array(z.string())
  ),
  user_rating: optionalFloat(1, 10),
})

export type ImportRow = z.infer<typeof importRowSchema>
