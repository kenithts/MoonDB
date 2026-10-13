import { RoLine } from '@/components/ro-text'
import { EquipImage } from '@/components/equips/equip-image'
import { FourthBadge, LevelBadge, TypeBadge } from '@/components/equips/equip-badges'
import { equipName, mainStats } from '@/lib/equips'
import { contentLines } from '@/lib/ro'
import type { EquipItem } from '@/lib/types'

export function EquipTile({ item, onSelect }: { item: EquipItem; onSelect: (item: EquipItem) => void }) {
  const lines = contentLines(item.description)
  const stats = mainStats(item)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-foreground/10 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <EquipImage item={item} lazy className="w-14 shrink-0 self-start" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm leading-tight font-medium">{equipName(item)}</h3>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">#{item.id}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <TypeBadge item={item} />
          <LevelBadge item={item} />
          <FourthBadge item={item} />
        </div>

        {stats.length > 0 && (
          <p className="font-mono text-[11px] text-foreground/80">{stats.join(' · ')}</p>
        )}

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
      </div>
    </button>
  )
}
