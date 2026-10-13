import { Contrast, Crosshair, Sparkles, type LucideIcon } from 'lucide-react'

import { SLOT_INFO } from '@/lib/ro'
import type { ClassTier, EquipCategory, EquipItem } from '@/lib/types'

export const CATEGORY_INFO: Record<EquipCategory, { label: string; icon: LucideIcon; color: string; className: string }> = {
  Weapon: { ...SLOT_INFO.Weapon },
  Shield: { ...SLOT_INFO.Shield },
  Headgear: { ...SLOT_INFO.Headgear },
  Armor: { ...SLOT_INFO.Armor },
  Garment: { ...SLOT_INFO.Garment },
  Shoes: { ...SLOT_INFO.Shoes },
  Accessory: { ...SLOT_INFO.Accessory },
  Ammo: { label: 'Munição', icon: Crosshair, color: 'text-orange-300', className: 'text-orange-300 bg-orange-500/10 ring-orange-400/20' },
  Shadow: { label: 'Sombra', icon: Contrast, color: 'text-slate-300', className: 'text-slate-300 bg-slate-500/15 ring-slate-400/25' },
  Costume: { label: 'Visual', icon: Sparkles, color: 'text-pink-300', className: 'text-pink-300 bg-pink-500/10 ring-pink-400/20' },
}

export const CATEGORIES = Object.keys(CATEGORY_INFO) as EquipCategory[]

export const WEAPON_TYPES: Record<string, string> = {
  Dagger: 'Adaga',
  '1hSword': 'Espada',
  '2hSword': 'Espada de 2 mãos',
  '1hSpear': 'Lança',
  '2hSpear': 'Lança de 2 mãos',
  '1hAxe': 'Machado',
  '2hAxe': 'Machado de 2 mãos',
  Mace: 'Maça',
  '2hMace': 'Maça de 2 mãos',
  Staff: 'Cajado',
  '2hStaff': 'Cajado de 2 mãos',
  Bow: 'Arco',
  Knuckle: 'Soqueira',
  Musical: 'Instrumento',
  Whip: 'Chicote',
  Book: 'Livro',
  Katar: 'Katar',
  Revolver: 'Revólver',
  Rifle: 'Rifle',
  Gatling: 'Gatling',
  Shotgun: 'Espingarda',
  Grenade: 'Lança-granadas',
  Huuma: 'Shuriken Huuma',
}

export const AMMO_TYPES: Record<string, string> = {
  Arrow: 'Flecha',
  Bullet: 'Bala',
  Kunai: 'Kunai',
  Grenade: 'Granada',
  Cannonball: 'Bala de canhão',
  CannonBall: 'Bala de canhão',
  Shuriken: 'Shuriken',
  Throwweapon: 'Arremessável',
  Dagger: 'Adaga de arremesso',
}

/** Rótulo do tipo do item: o tipo de arma/munição quando houver, senão a categoria. */
export function typeLabel(item: EquipItem) {
  if (item.category === 'Weapon' && item.subType) return WEAPON_TYPES[item.subType] ?? item.subType
  if (item.category === 'Ammo' && item.subType) return AMMO_TYPES[item.subType] ?? item.subType
  return CATEGORY_INFO[item.category].label
}

/**
 * Jobs do rAthena (cada chave cobre a linha inteira: Knight = Knight, Lord Knight, Rune Knight e
 * Dragon Knight). Rótulo = classe de 4ª; dica = de onde ela vem.
 */
export const JOB_GROUPS: { heading: string; jobs: { key: string; label: string; hint?: string }[] }[] = [
  {
    heading: 'Aprendizes',
    jobs: [
      { key: 'Novice', label: 'Novice' },
      { key: 'SuperNovice', label: 'Hyper Novice', hint: 'Super Novice' },
    ],
  },
  {
    heading: 'Espadachim',
    jobs: [
      { key: 'Swordman', label: 'Swordman', hint: '1ª classe' },
      { key: 'Knight', label: 'Dragon Knight', hint: 'Knight · Rune Knight' },
      { key: 'Crusader', label: 'Imperial Guard', hint: 'Crusader · Royal Guard' },
    ],
  },
  {
    heading: 'Mago',
    jobs: [
      { key: 'Mage', label: 'Mage', hint: '1ª classe' },
      { key: 'Wizard', label: 'Arch Mage', hint: 'Wizard · Warlock' },
      { key: 'Sage', label: 'Elemental Master', hint: 'Sage · Sorcerer' },
    ],
  },
  {
    heading: 'Arqueiro',
    jobs: [
      { key: 'Archer', label: 'Archer', hint: '1ª classe' },
      { key: 'Hunter', label: 'Windhawk', hint: 'Hunter · Ranger' },
      { key: 'BardDancer', label: 'Troubadour / Trouvère', hint: 'Bard/Dancer · Minstrel/Wanderer' },
    ],
  },
  {
    heading: 'Noviço',
    jobs: [
      { key: 'Acolyte', label: 'Acolyte', hint: '1ª classe' },
      { key: 'Priest', label: 'Cardinal', hint: 'Priest · Arch Bishop' },
      { key: 'Monk', label: 'Inquisitor', hint: 'Monk · Sura' },
    ],
  },
  {
    heading: 'Mercador',
    jobs: [
      { key: 'Merchant', label: 'Merchant', hint: '1ª classe' },
      { key: 'Blacksmith', label: 'Meister', hint: 'Blacksmith · Mechanic' },
      { key: 'Alchemist', label: 'Biolo', hint: 'Alchemist · Genetic' },
    ],
  },
  {
    heading: 'Gatuno',
    jobs: [
      { key: 'Thief', label: 'Thief', hint: '1ª classe' },
      { key: 'Assassin', label: 'Shadow Cross', hint: 'Assassin · Guillotine Cross' },
      { key: 'Rogue', label: 'Abyss Chaser', hint: 'Rogue · Shadow Chaser' },
    ],
  },
  {
    heading: 'Expandidas',
    jobs: [
      { key: 'Taekwon', label: 'Taekwon' },
      { key: 'StarGladiator', label: 'Sky Emperor', hint: 'Star Gladiator · Star Emperor' },
      { key: 'SoulLinker', label: 'Soul Ascetic', hint: 'Soul Linker · Soul Reaper' },
      { key: 'Ninja', label: 'Ninja' },
      { key: 'KagerouOboro', label: 'Shinkiro / Shiranui', hint: 'Kagerou / Oboro' },
      { key: 'Gunslinger', label: 'Gunslinger' },
      { key: 'Rebellion', label: 'Night Watch', hint: 'Rebellion' },
      { key: 'Summoner', label: 'Doram', hint: 'Summoner · Spirit Handler' },
    ],
  },
]

export const JOB_LABEL = Object.fromEntries(JOB_GROUPS.flatMap((g) => g.jobs.map((j) => [j.key, j.label])))
export const ALL_JOBS = JOB_GROUPS.flatMap((g) => g.jobs.map((j) => j.key))

export const CLASS_TIER_LABEL: Record<ClassTier, string> = {
  Normal: 'Normal',
  Upper: 'Transcendental',
  Baby: 'Baby',
  Third: '3ª classe',
  Third_Upper: '3ª classe (trans)',
  Third_Baby: '3ª classe baby',
  Fourth: '4ª classe',
}

export const ALL_TIERS = Object.keys(CLASS_TIER_LABEL) as ClassTier[]

/** Resumo curto da restrição de tier, ou null quando qualquer tier equipa. */
export function tierSummary(classes: ClassTier[] | undefined) {
  if (!classes) return null
  const set = new Set(classes)
  if (set.size === 1 && set.has('Fourth')) return 'Somente 4ª classe'
  if (['Third', 'Third_Upper', 'Third_Baby', 'Fourth'].every((t) => set.has(t as ClassTier)) && set.size === 4)
    return '3ª classe ou superior'
  return classes.map((t) => CLASS_TIER_LABEL[t]).join(', ')
}

/** "Sword [3]" — o nome com a quantidade de slots, como no client. */
export function equipName(item: EquipItem) {
  return item.slots > 0 ? `${item.name} [${item.slots}]` : item.name
}

/** Atributos principais em uma linha: ATK 25 · MATK 100 · DEF 10. */
export function mainStats(item: EquipItem) {
  const out: string[] = []
  if (item.attack) out.push(`ATK ${item.attack}`)
  if (item.magicAttack) out.push(`MATK ${item.magicAttack}`)
  if (item.defense) out.push(`DEF ${item.defense}`)
  return out
}
