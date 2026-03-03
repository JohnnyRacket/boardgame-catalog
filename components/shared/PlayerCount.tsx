import { Users } from 'lucide-react'

interface PlayerCountProps {
  min: number
  max: number
}

export function PlayerCount({ min, max }: PlayerCountProps) {
  const label = min === max ? `${min}` : `${min}–${max}`
  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Users className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
