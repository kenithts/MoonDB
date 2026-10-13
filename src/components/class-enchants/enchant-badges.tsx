import { ENCHANT_SLOT_LABEL, TIER_GROUP_LABEL, TIER_GROUP_STYLE } from '@/lib/class-enchants'
import { cn } from '@/lib/utils'
import type { ClassEnchant } from '@/lib/types'

const PILL = 'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset'

export function EnchantSlotBadge({ item }: { item: ClassEnchant }) {
  return (
    <span className={cn(PILL, 'bg-pink-500/10 text-pink-300 ring-pink-400/20')}>
      Costume · {ENCHANT_SLOT_LABEL[item.slot]}
    </span>
  )
}

export function TierBadge({ item }: { item: ClassEnchant }) {
  return <span className={cn(PILL, TIER_GROUP_STYLE[item.tier])}>{TIER_GROUP_LABEL[item.tier]}</span>
}
