import { cn } from '@/lib/utils'
import { SLOT_INFO } from '@/lib/ro'
import type { Slot } from '@/lib/types'

export function SlotBadge({ slot, className }: { slot: Slot; className?: string }) {
  const info = SLOT_INFO[slot]
  const Icon = info.icon
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset',
        info.className,
        className,
      )}
    >
      <Icon className="size-3" />
      {info.label}
    </span>
  )
}
