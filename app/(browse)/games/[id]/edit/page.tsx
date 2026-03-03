import { notFound } from 'next/navigation'
import { getGameById, getGenres } from '@/lib/db/queries'
import { GameEditForm } from '@/components/add-game/GameEditForm'
import { BackButton } from '@/components/catalog/BackButton'

interface EditGamePageProps {
  params: Promise<{ id: string }>
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  const { id } = await params
  const numericId = Number(id)

  const [game, genres] = await Promise.all([getGameById(numericId), getGenres()])

  if (!game) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <BackButton
          fallbackHref={`/games?game=${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </BackButton>
        <h1 className="text-2xl font-bold">Edit Game</h1>
      </div>
      <GameEditForm game={game} genres={genres} />
    </div>
  )
}
