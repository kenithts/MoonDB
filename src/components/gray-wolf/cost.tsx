import { Coins, Gem } from 'lucide-react'

import { formatNumber } from '@/lib/gray-wolf'
import { cn } from '@/lib/utils'

/** Quantidade de Amethyst Fragment. */
export function Amethyst({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium whitespace-nowrap text-violet-300', className)}>
      <Gem className="size-3.5" />
      <span className="font-mono">{formatNumber(value)}</span>
    </span>
  )
}

export function Zeny({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-amber-300/90', className)}>
      <Coins className="size-3.5" />
      <span className="font-mono">{formatNumber(value)}z</span>
    </span>
  )
}
