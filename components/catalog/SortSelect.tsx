'use client'

import { useQueryState } from 'nuqs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SORT_OPTIONS } from '@/lib/constants'
import { parseAsString } from 'nuqs'

export function SortSelect() {
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsString.withDefault('name_asc')
  )

  return (
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Sort by…" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
