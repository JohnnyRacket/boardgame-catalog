import { Badge } from '@/components/ui/badge'
import { COMPLEXITY_LABELS } from '@/lib/constants'

const colorMap: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  2: 'bg-green-100 text-green-800 hover:bg-green-100',
  3: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  4: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  5: 'bg-red-100 text-red-800 hover:bg-red-100',
}

interface ComplexityBadgeProps {
  complexity: number
}

export function ComplexityBadge({ complexity }: ComplexityBadgeProps) {
  const label = COMPLEXITY_LABELS[complexity] ?? 'Unknown'
  const color = colorMap[complexity] ?? ''
  return (
    <Badge className={color} variant="secondary">
      {label}
    </Badge>
  )
}
