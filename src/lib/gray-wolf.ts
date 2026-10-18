import type { GrayWolfEnchant, GrayWolfOption, GrayWolfPiece, GrayWolfPieceInfo, ZenyAmethyst } from '@/lib/types'

export const PIECE_LABEL: Record<GrayWolfPiece, string> = {
  Armor: 'Armor',
  Garment: 'Garment',
  Shoes: 'Shoes',
  AccR: 'Accessory (R)',
  AccL: 'Accessory (L)',
}

export const PIECES = Object.keys(PIECE_LABEL) as GrayWolfPiece[]

export const STEPS = [1, 2, 3]

export function stepLabel(step: number) {
  return `${step}º`
}

export type Method = 'random' | 'perfect' | 'special'

export const METHOD_LABEL: Record<Method, string> = {
  random: 'Sorteio (encantamento comum)',
  perfect: 'Escolha direta (zeny + ametistas)',
  special: 'Special Amethyst Fragment',
}

export const METHODS = Object.keys(METHOD_LABEL) as Method[]

export function optionMethods(o: GrayWolfOption): Method[] {
  const out: Method[] = []
  if (o.chance !== undefined) out.push('random')
  if (o.perfect) out.push('perfect')
  if (o.special) out.push('special')
  return out
}

/** "Wolf Orb (Str) Level 1" -> família "Str", nível 1. */
export function orbParts(e: GrayWolfEnchant) {
  const m = e.name.match(/\(([^)]*)\)\s*(?:Level\s*(\d+))?\s*$/i)
  return { family: m?.[1] ?? e.name, level: m?.[2] ? Number(m[2]) : null }
}

export function orbTitle(e: GrayWolfEnchant) {
  const { family, level } = orbParts(e)
  return level ? `${family} Lv ${level}` : family
}

/** Mantém as famílias juntas (na ordem do primeiro id) e ordena por nível dentro delas. */
export function sortByFamily(enchants: GrayWolfEnchant[]) {
  const first = new Map<string, number>()
  for (const e of enchants) {
    const f = orbParts(e).family
    first.set(f, Math.min(first.get(f) ?? Infinity, e.id))
  }
  return [...enchants].sort((a, b) => {
    const pa = orbParts(a)
    const pb = orbParts(b)
    return first.get(pa.family)! - first.get(pb.family)! || (pa.level ?? 0) - (pb.level ?? 0) || a.id - b.id
  })
}

/** Opções do orb agrupadas por peça, na ordem das peças. */
export function optionsByPiece(e: GrayWolfEnchant) {
  return PIECES.map((piece) => ({
    piece,
    options: e.options.filter((o) => o.piece === piece).sort((a, b) => a.step - b.step),
  })).filter((g) => g.options.length > 0)
}

const NUM = new Intl.NumberFormat('pt-BR')

export function formatNumber(n: number) {
  return NUM.format(n)
}

export function formatPercent(n: number) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: n < 1 ? 2 : 1 }).format(n)}%`
}

export function sameCost(a: ZenyAmethyst | null | undefined, b: ZenyAmethyst | null | undefined) {
  return a?.zeny === b?.zeny && a?.amethyst === b?.amethyst
}

/** Custo de um encantamento que todas as peças compartilham (null se variar). */
export function sharedStepCost(pieces: GrayWolfPieceInfo[], step: number) {
  const costs = pieces.map((p) => p.steps.find((s) => s.step === step))
  const first = costs[0]
  return first && costs.every((c) => sameCost(c, first)) ? first : null
}
