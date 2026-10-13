import { ArrowRight } from 'lucide-react'

import { DetailSection, ItemDetailDialog } from '@/components/item-detail'
import { EquipImage } from '@/components/equips/equip-image'
import { GradeBadge } from '@/components/automatic/module-badges'
import { PIECE_LABEL } from '@/lib/automatic'
import type { AutomaticModule } from '@/lib/types'

export function ModuleDialog({ item, onClose }: { item: AutomaticModule | null; onClose: () => void }) {
  return (
    <ItemDetailDialog
      item={item}
      onClose={onClose}
      scripts={[{ label: 'Efeito', code: item?.orb?.script }]}
      image={item && <EquipImage item={item} className="rounded-lg p-2" />}
    >
      {item && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <GradeBadge grade={item.grade} />
            {item.orb && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="size-3.5" />
                vira <span className="text-foreground">{item.orb.name}</span>
                <span className="font-mono">#{item.orb.id}</span>
              </span>
            )}
          </div>

          <DetailSection title="Onde encaixa">
            <ul className="divide-y divide-border overflow-hidden rounded-lg ring-1 ring-foreground/10">
              {item.pieces.map((p) => (
                <li key={p.piece} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-36 shrink-0 font-medium">{PIECE_LABEL[p.piece]}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {p.equipment.map((e) => e.name).join(', ')}
                  </span>
                  <span className="shrink-0 text-xs">
                    até <span className="font-mono font-medium">{p.max}</span> {p.max === 1 ? 'cópia' : 'cópias'}
                  </span>
                </li>
              ))}
            </ul>
          </DetailSection>
        </>
      )}
    </ItemDetailDialog>
  )
}
