import { RoLine } from '@/components/ro-text'
import { EquipImage } from '@/components/equips/equip-image'
import { PieceBadges } from '@/components/gray-wolf/orb-badges'
import { orbTitle } from '@/lib/gray-wolf'
import { contentLines } from '@/lib/ro'
import type { GrayWolfEnchant } from '@/lib/types'

export function OrbTile({ item, onSelect }: { item: GrayWolfEnchant; onSelect: (item: GrayWolfEnchant) => void }) {
  const lines = contentLines(item.description)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-foreground/10 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <EquipImage item={item} lazy className="w-12 shrink-0 self-start" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-tight font-medium">{orbTitle(item)}</h3>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{item.id}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <PieceBadges item={item} />
        </div>

        {lines.length > 0 && (
          <div className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <RoLine text={line} />
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
