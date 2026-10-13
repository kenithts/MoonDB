import type { ClassEnchant, ClassTierGroup, EnchantSlot } from '@/lib/types'

export const ENCHANT_SLOT_LABEL: Record<EnchantSlot, string> = {
  Upper: 'Topo',
  Middle: 'Meio',
  Lower: 'Baixo',
  Garment: 'Capa',
}

export const ENCHANT_SLOTS = Object.keys(ENCHANT_SLOT_LABEL) as EnchantSlot[]

export const TIER_GROUP_LABEL: Record<ClassTierGroup, string> = {
  expanded: 'Expandida',
  trans: 'Transcendental',
  third: '3ª classe',
  fourth: '4ª classe',
}

export const TIER_GROUPS = Object.keys(TIER_GROUP_LABEL) as ClassTierGroup[]

export const TIER_GROUP_STYLE: Record<ClassTierGroup, string> = {
  expanded: 'bg-muted text-muted-foreground ring-foreground/10',
  trans: 'bg-sky-500/10 text-sky-300 ring-sky-400/20',
  third: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  fourth: 'bg-primary/10 text-primary ring-primary/25',
}

/** Nome do grupo exibido no grid: a classe e a geração da pedra (I/II). */
export function enchantGroup(e: ClassEnchant) {
  return e.generation === 2 ? `${e.className} II` : e.className
}
