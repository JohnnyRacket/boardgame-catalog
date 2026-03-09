import { Badge } from '@/components/ui/badge'
import { INTERACTION_LABELS } from '@/lib/constants'

const colorMap: Record<string, string> = {
  cooperative: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  competitive: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
  teams: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
}

interface InteractionBadgeProps {
  interaction: string
}

export function InteractionBadge({ interaction }: InteractionBadgeProps) {
  const label = INTERACTION_LABELS[interaction] ?? interaction
  const color = colorMap[interaction] ?? ''
  return (
    <Badge className={color} variant="secondary">
      {label}
    </Badge>
  )
}
