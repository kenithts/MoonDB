import { Sparkles } from 'lucide-react'

import { PIECE_LABEL, optionsByPiece, stepLabel } from '@/lib/gray-wolf'
import { cn } from '@/lib/utils'
import type { GrayWolfEnchant } from '@/lib/types'

const PILL = 'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset'

/** "Armor 1º 2º 3º✦": peças e encantamentos onde o orb pode sair (✦ = dá para escolher pagando). */
export function PieceBadges({ item }: { item: GrayWolfEnchant }) {
  return (
    <>
      {optionsByPiece(item).map(({ piece, options }) => (
        <span key={piece} className={cn(PILL, 'bg-muted/60 text-foreground/80 ring-foreground/10')}>
          {PIECE_LABEL[piece]}
          {options.map((o) => (
            <span
              key={o.step}
              className={cn(
                'inline-flex items-center font-mono',
                o.chance === undefined ? 'text-violet-300' : 'text-muted-foreground',
              )}
            >
              {stepLabel(o.step)}
              {o.perfect && <Sparkles className="size-2.5 text-violet-300" />}
            </span>
          ))}
        </span>
      ))}
    </>
  )
}
