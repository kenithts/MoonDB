import { CATEGORY_INFO, typeLabel } from '@/lib/equips'
import { cn } from '@/lib/utils'
import type { EquipItem } from '@/lib/types'

const PILL = 'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset'

export function TypeBadge({ item }: { item: EquipItem }) {
  const info = CATEGORY_INFO[item.category]
  const Icon = info.icon
  return (
    <span className={cn(PILL, info.className)}>
      <Icon className="size-3" />
      {typeLabel(item)}
    </span>
  )
}

export function LevelBadge({ item }: { item: EquipItem }) {
  if (!item.levelMin && !item.levelMax) return null
  const text = item.levelMax
    ? `Nv. ${item.levelMin ?? 1}–${item.levelMax}`
    : `Nv. ${item.levelMin}+`
  return <span className={cn(PILL, 'bg-muted text-muted-foreground ring-foreground/10')}>{text}</span>
}

export function FourthBadge({ item }: { item: EquipItem }) {
  if (!item.classes || item.classes.length !== 1 || item.classes[0] !== 'Fourth') return null
  return <span className={cn(PILL, 'bg-primary/10 text-primary ring-primary/25')}>4ª classe</span>
}
