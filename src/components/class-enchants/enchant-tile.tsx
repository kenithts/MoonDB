import { Link2 } from 'lucide-react'

import { RoLine } from '@/components/ro-text'
import { EquipImage } from '@/components/equips/equip-image'
import { EnchantSlotBadge } from '@/components/class-enchants/enchant-badges'
import { contentLines, stripColors } from '@/lib/ro'
import type { ClassEnchant } from '@/lib/types'

export function EnchantTile({ item, onSelect }: { item: ClassEnchant; onSelect: (item: ClassEnchant) => void }) {
  // A partir de "When equipped with X" a descrição fala do combo, que já aparece no rodapé do tile.
  const all = contentLines(item.description)
  const comboStart = all.findIndex((l) => /^\s*When equipped with/i.test(stripColors(l)))
  const lines = comboStart === -1 ? all : all.slice(0, comboStart)
  const partners = [...new Set(item.combos.flatMap((c) => c.items.map((i) => i.name)))]

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-foreground/10 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <EquipImage item={item} lazy className="w-12 shrink-0 self-start" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-tight font-medium">{item.name}</h3>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{item.id}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <EnchantSlotBadge item={item} />
          {!item.implemented && (
            <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-[11px] text-muted-foreground">
              sem efeito no rAthena
            </span>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <RoLine text={line} />
              </span>
            ))}
          </div>
        ) : item.script ? (
          <pre className="line-clamp-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground/80">
            {item.script}
          </pre>
        ) : null}

        {partners.length > 0 && (
          <p className="mt-auto flex items-start gap-1.5 border-t border-border pt-1.5 text-[11px] text-amber-200/90">
            <Link2 className="mt-px size-3 shrink-0" />
            <span>Combo com {partners.join(', ')}</span>
          </p>
        )}
      </div>
    </button>
  )
}
