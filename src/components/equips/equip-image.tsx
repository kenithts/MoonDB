import { Package } from 'lucide-react'

import { itemImage } from '@/lib/data'
import { cn } from '@/lib/utils'

/** Ilustração de um item (img/items): a "collection" do client vem em fundo branco, como no jogo. */
export function EquipImage({
  item,
  className,
  lazy,
}: {
  item: { id: number; image?: 'collection' | 'icon' }
  className?: string
  lazy?: boolean
}) {
  return (
    <div
      className={cn(
        'flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md ring-1 ring-foreground/10',
        item.image ? 'bg-white' : 'bg-muted',
        className,
      )}
    >
      {item.image ? (
        <img
          src={itemImage(item.id)}
          alt=""
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          className={cn(item.image === 'icon' ? 'size-1/2 [image-rendering:pixelated]' : 'size-full object-contain')}
        />
      ) : (
        <Package className="size-1/3 text-muted-foreground/40" />
      )}
    </div>
  )
}
