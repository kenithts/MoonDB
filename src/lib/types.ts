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

export type GrayWolfPiece = 'Armor' | 'Garment' | 'Shoes' | 'AccR' | 'AccL'

export interface ZenyAmethyst {
  zeny: number
  amethyst: number
}

export interface ItemRef {
  id: number
  name: string
  image?: 'collection' | 'icon' | null
}

/** Onde um Wolf Orb pode sair: peça + ordem do encantamento (1º = slot 4, 2º = slot 3, 3º = slot 2). */
export interface GrayWolfOption {
  piece: GrayWolfPiece
  step: number
  /** % no sorteio do encantamento comum; ausente = não sai no sorteio. */
  chance?: number
  /** Escolha direta (encantamento "perfeito") pagando zeny + Amethyst Fragment. */
  perfect?: ZenyAmethyst
  /** Escolha direta com Special Amethyst Fragment (quantidade). */
  special?: number
}

/** Wolf Orb (Card/Enchant) de public/data/gray_wolf.json. */
export interface GrayWolfEnchant extends BaseItem {
  script?: string
  options: GrayWolfOption[]
  image?: 'collection' | 'icon'
}

export interface GrayWolfStep {
  step: number
  /** Slot da carta no item (4, 3, 2). */
  slot: number
  zeny: number
  amethyst: number
  /** % de sucesso da tentativa (100 = nunca falha). */
  successRate: number
  /** Quantos orbs entram no sorteio / na escolha direta / na escolha com Special Amethyst. */
  random: number
  perfect: number
  perfectCost: ZenyAmethyst | null
  special: number
}

export interface GrayWolfPieceInfo {
  piece: GrayWolfPiece
  /** Id do item_enchant.yml aberto pelo NPC. */
  enchantId: number
  equipment: ItemRef[]
  minRefine: number
  reset: (ZenyAmethyst & { chance: number }) | null
  steps: GrayWolfStep[]
}

export interface Fragment extends ItemRef {
  description: string[]
  obtainedFrom: BoxSource[]
}

/** public/data/gray_wolf.json (gerado por scripts/build_gray_wolf.py). */
export interface GrayWolfData {
  amethyst: Fragment
  special: Fragment
  pieces: GrayWolfPieceInfo[]
  /** Lojas (barter) da vila que aceitam Amethyst Fragment. */
  shop: (ItemRef & { amethyst: number })[]
  enchants: GrayWolfEnchant[]
}

export type Element = 'Neutral' | 'Water' | 'Earth' | 'Fire' | 'Wind' | 'Poison' | 'Holy' | 'Dark' | 'Ghost' | 'Undead'
export type Difficulty = 'easy' | 'hard' | 'nightmare' | 'hallucination'

/** Monstro de uma dificuldade de Cheffenia; sem `id` = o rAthena não tem dados dele. */
export interface CheffeniaMob {
  name: string
  hp: number
  id?: number
  rathenaName?: string
  level?: number
  element?: Element
  elementLevel?: number
  race?: string
  size?: string
  mvp?: boolean
  /** 'game' = dados lidos no jogo pelo usuário (o rAthena não tem o monstro). */
  source?: 'game'
  /** Existe public/img/mobs/<id>.webp (pose parada do sprite do client). */
  sprite?: boolean
}

/** public/data/cheffenia.json (gerado por scripts/build_cheffenia.py). */
export interface CheffeniaData {
  difficulties: Record<Difficulty, CheffeniaMob[]>
  /** Nível do elemento do alvo -> elemento do ataque -> elemento do alvo -> % de dano (attr_fix.yml). */
  attr: Record<string, Record<Element, Record<Element, number>>>
}
