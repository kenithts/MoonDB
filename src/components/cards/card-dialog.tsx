import { Coins, Package, Weight } from 'lucide-react'

import { ItemDetailDialog } from '@/components/item-detail'
import { SlotBadge } from '@/components/cards/slot-badge'
import { cardImage } from '@/lib/data'
import type { CardItem } from '@/lib/types'

export function CardDialog({ item, onClose }: { item: CardItem | null; onClose: () => void }) {
  return (
    <ItemDetailDialog
      item={item}
      onClose={onClose}
      scripts={[
        { label: 'Ao equipar', code: item?.script },
        { label: 'Ao desequipar', code: item?.unequipScript },
      ]}
      image={
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          {item?.image ? (
            <img src={cardImage(item.id)} alt={item.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <Package className="size-10" />
            </div>
          )}
        </div>
      }
    >
      {item && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {item.slots.map((slot) => (
              <SlotBadge key={slot} slot={slot} />
            ))}
            {item.prefix && (
              <span className="text-xs text-muted-foreground">
                {item.postfix ? 'Sufixo' : 'Prefixo'}:{' '}
                <span className="font-medium text-foreground">{item.prefix}</span>
              </span>
            )}
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Weight className="size-3.5" /> Peso {item.weight}
            </span>
            {item.buy != null && (
              <span className="inline-flex items-center gap-1">
                <Coins className="size-3.5" /> {item.buy.toLocaleString('pt-BR')} z
              </span>
            )}
          </div>
        </>
      )}
    </ItemDetailDialog>
  )
}
