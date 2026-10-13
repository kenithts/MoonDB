import { Crown, Ghost, Package, Skull, Swords, type LucideIcon } from 'lucide-react'

import { stripColors } from '@/lib/ro'
import type { BaseItem, Slot } from '@/lib/types'

export const SLOTS: Slot[] = ['Weapon', 'Shield', 'Armor', 'Garment', 'Shoes', 'Headgear', 'Accessory']

export type Origin = 'mvp' | 'boss' | 'normal' | 'box' | 'none'

export const ORIGIN_INFO: Record<Origin, { label: string; icon: LucideIcon; className: string }> = {
  mvp: { label: 'MVP', icon: Crown, className: 'text-amber-400' },
  boss: { label: 'Boss', icon: Skull, className: 'text-rose-400' },
  normal: { label: 'Monstro comum', icon: Swords, className: 'text-muted-foreground' },
  box: { label: 'Caixas e álbuns', icon: Package, className: 'text-sky-300' },
  none: { label: 'Sem fonte conhecida', icon: Ghost, className: 'text-muted-foreground/60' },
}

export const ORIGINS = Object.keys(ORIGIN_INFO) as Origin[]

/** Opções do filtro "Como obter", compartilhado por cartas e equipamentos. */
export const ORIGIN_OPTIONS = ORIGINS.map((origin) => ({
  value: origin,
  label: ORIGIN_INFO[origin].label,
  icon: ORIGIN_INFO[origin].icon,
  iconClassName: ORIGIN_INFO[origin].className,
}))

/** Como o item pode ser obtido: tipos de monstro que dropam e/ou caixas (pode ter várias). */
export function itemOrigins(item: BaseItem): Origin[] {
  const out = new Set<Origin>()
  for (const mob of item.droppedBy) out.add(mob.mvp ? 'mvp' : mob.boss ? 'boss' : 'normal')
  if (item.obtainedFrom.length > 0) out.add('box')
  if (out.size === 0) out.add('none')
  return [...out]
}

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Texto indexado para a busca: nome, ID, aegis, nome KR, descrição e extras. */
export function searchText(item: BaseItem, ...extra: (string | null | undefined)[]) {
  return normalize(
    [item.id, item.name, item.aegis, item.krName, ...extra, ...item.description.map(stripColors)]
      .filter(Boolean)
      .join(' '),
  )
}

export function matchesQuery(text: string, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return terms.every((t) => text.includes(t))
}
