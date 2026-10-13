import { Package } from 'lucide-react'

import { RoLine } from '@/components/ro-text'
import { SlotBadge } from '@/components/cards/slot-badge'
import { cardImage } from '@/lib/data'
import { ORIGIN_INFO } from '@/lib/cards'
import { contentLines } from '@/lib/ro'
import type { CardItem } from '@/lib/types'

export function CardTile({ card, onSelect }: { card: CardItem; onSelect: (card: CardItem) => void }) {
  const lines = contentLines(card.description)
  const isMvp = card.droppedBy.some((mob) => mob.mvp)
  const MvpIcon = ORIGIN_INFO.mvp.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      className="group flex gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-foreground/10 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="aspect-[3/4] w-16 shrink-0 self-start overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
        {card.image ? (
          <img
            src={cardImage(card.id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground/40">
            <Package className="size-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-tight font-medium">{card.name}</h3>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{card.id}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {card.slots.map((slot) => (
            <SlotBadge key={slot} slot={slot} />
          ))}
          {isMvp && (
            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-500/10 px-2 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/20 ring-inset">
              <MvpIcon className="size-3" />
              MVP
            </span>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <RoLine text={line} />
              </span>
            ))}
          </div>
        ) : card.script ? (
          <pre className="line-clamp-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground/80">
            {card.script}
          </pre>
        ) : null}
      </div>
    </button>
  )
}
