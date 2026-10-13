import { Link2 } from 'lucide-react'

import { DetailSection, ItemDetailDialog } from '@/components/item-detail'
import { EquipImage } from '@/components/equips/equip-image'
import { EnchantSlotBadge, TierBadge } from '@/components/class-enchants/enchant-badges'
import type { ClassEnchant } from '@/lib/types'

function Combos({ item }: { item: ClassEnchant }) {
  if (item.combos.length === 0) return null
  return (
    <DetailSection title={`Combos (${item.combos.length})`}>
      <ul className="flex flex-col gap-2">
        {item.combos.map((combo, i) => (
          <li key={i} className="rounded-lg bg-muted/50 p-3 ring-1 ring-foreground/10">
            <p className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
              <Link2 className="size-3.5 text-amber-300" />
              <span className="text-muted-foreground">Junto com</span>
              {combo.items.map((partner) => (
                <span key={partner.id} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                  {partner.name} <span className="font-mono opacity-60">#{partner.id}</span>
                </span>
              ))}
            </p>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap">{combo.script}</pre>
          </li>
        ))}
      </ul>
    </DetailSection>
  )
}

export function EnchantDialog({ item, onClose }: { item: ClassEnchant | null; onClose: () => void }) {
  return (
    <ItemDetailDialog
      item={item}
      onClose={onClose}
      scripts={[{ label: 'Efeito', code: item?.script }]}
      image={item && <EquipImage item={item} className="rounded-lg p-2" />}
      afterEffect={item && <Combos item={item} />}
    >
      {item && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <EnchantSlotBadge item={item} />
            <TierBadge item={item} />
            <span className="text-xs text-muted-foreground">
              Classe: <span className="font-medium text-foreground">{item.className}</span>
            </span>
          </div>

          {!item.implemented && (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              O rAthena tem apenas o item da pedra, sem o script do efeito. A descrição abaixo é a do client.
            </p>
          )}

          {item.stones.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Item da pedra:{' '}
              {item.stones.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ', '}
                  <span className="text-foreground">{s.name}</span> <span className="font-mono">#{s.id}</span>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </ItemDetailDialog>
  )
}
