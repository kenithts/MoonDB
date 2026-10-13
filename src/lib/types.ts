export type Slot =
  | 'Weapon'
  | 'Shield'
  | 'Armor'
  | 'Garment'
  | 'Shoes'
  | 'Headgear'
  | 'Accessory'

export interface Drop {
  id: number
  name: string
  level: number
  /** Chance base do rAthena (1x), em %. */
  rate: number
  mvp: boolean
  boss: boolean
  /** Recompensa entregue ao jogador MVP (MvpDrops), não um drop comum. */
  mvpReward: boolean
  /** Drop que só existe no pre-renewal (o item não dropa de nenhum monstro no renewal). */
  preRe?: boolean
}

/** Caixa/álbum (item group do rAthena) que pode dar o item. */
export interface BoxSource {
  id: number
  name: string
  /** Chance em % dentro do sorteio da caixa (100 = garantido). */
  chance: number
}

/** Campos comuns a qualquer item exibido no MoonDB. */
export interface BaseItem {
  id: number
  aegis: string
  name: string
  weight: number
  buy?: number | null
  modes: ('re' | 'pre-re')[]
  droppedBy: Drop[]
  obtainedFrom: BoxSource[]
  description: string[]
  krName?: string | null
}

/** Linha de public/data/cards.json (gerado por scripts/build_cards.py). */
export interface CardItem extends BaseItem {
  slots: Slot[]
  flags: string[]
  script: string | null
  unequipScript: string | null
  prefix: string | null
  postfix: boolean
  image: boolean
}

export type EquipCategory =
  | 'Weapon'
  | 'Shield'
  | 'Headgear'
  | 'Armor'
  | 'Garment'
  | 'Shoes'
  | 'Accessory'
  | 'Ammo'
  | 'Shadow'
  | 'Costume'

export type ClassTier = 'Normal' | 'Upper' | 'Baby' | 'Third' | 'Third_Upper' | 'Third_Baby' | 'Fourth'

/**
 * Linha de public/data/equips.json (gerado por scripts/build_equips.py).
 * Campos nulos são omitidos do JSON.
 */
export interface EquipItem extends BaseItem {
  category: EquipCategory
  subType?: string
  locations: string[]
  slots: number
  attack?: number
  magicAttack?: number
  defense?: number
  range?: number
  weaponLevel?: number
  armorLevel?: number
  levelMin?: number
  levelMax?: number
  refineable: boolean
  gradable: boolean
  gender?: 'Female' | 'Male'
  /** Chaves de job do rAthena que equipam; ausente = todas. */
  jobs?: string[]
  /** Tiers de classe que equipam; ausente = todos. */
  classes?: ClassTier[]
  script?: string
  equipScript?: string
  unequipScript?: string
  /** 'collection' = ilustração 75x100, 'icon' = ícone 24x24 do inventário. */
  image?: 'collection' | 'icon'
}

export type EnchantSlot = 'Upper' | 'Middle' | 'Lower' | 'Garment'
export type ClassTierGroup = 'expanded' | 'trans' | 'third' | 'fourth'

export interface ComboDef {
  /** Os outros itens do combo (além do próprio). */
  items: { id: number; name: string }[]
  script: string
}

/**
 * Linha de public/data/class_enchants.json (gerado por scripts/build_class_enchants.py):
 * pedras de classe encaixadas em equipamentos de costume.
 */
export interface ClassEnchant extends BaseItem {
  className: string
  /** Chave de job do rAthena (linha da classe). */
  job: string
  tier: ClassTierGroup
  slot: EnchantSlot
  generation: 1 | 2
  /** Itens "pedra" (Type: Etc) que o jogador recebe e que viram este encantamento. */
  stones: { id: number; name: string }[]
  /** false = só existe a pedra; o rAthena não implementa o efeito. */
  implemented: boolean
  script?: string
  combos: ComboDef[]
  image?: 'collection' | 'icon'
}

export type ModuleGrade = 'normal' | 'rare' | 'unique' | 'legendary' | 'epic1' | 'epic2' | 'epic3'
export type AutomaticPiece = 'Garment' | 'Armor' | 'Shoes' | 'Accessory'

/** Linha de public/data/automatic.json (gerado por scripts/build_automatic.py). */
export interface AutomaticModule extends BaseItem {
  grade: ModuleGrade
  /** Encantamento (Card) que o módulo vira no equipamento; tem o script do efeito. */
  orb?: { id: number; name: string; script?: string }
  /** Peças que aceitam o módulo e quantas cópias do mesmo módulo cabem em cada uma. */
  pieces: { piece: AutomaticPiece; max: number; equipment: { id: number; name: string }[] }[]
  image?: 'collection' | 'icon'
}
