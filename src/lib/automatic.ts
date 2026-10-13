import { isSeparator, stripColors } from '@/lib/ro'
import type { AutomaticModule, AutomaticPiece, ModuleGrade } from '@/lib/types'

export const GRADE_LABEL: Record<ModuleGrade, string> = {
  normal: 'Normal',
  rare: 'Rare',
  unique: 'Unique',
  legendary: 'Legendary',
  epic1: 'Epic I',
  epic2: 'Epic II',
  epic3: 'Epic III',
}

export const GRADES = Object.keys(GRADE_LABEL) as ModuleGrade[]

export const GRADE_STYLE: Record<ModuleGrade, string> = {
  normal: 'bg-muted text-muted-foreground ring-foreground/15',
  rare: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
  unique: 'bg-violet-500/10 text-violet-300 ring-violet-400/25',
  legendary: 'bg-amber-500/10 text-amber-300 ring-amber-400/30',
  epic1: 'bg-rose-500/10 text-rose-300 ring-rose-400/25',
  epic2: 'bg-rose-500/15 text-rose-300 ring-rose-400/35',
  epic3: 'bg-rose-500/20 text-rose-200 ring-rose-400/45',
}

export const PIECE_LABEL: Record<AutomaticPiece, string> = {
  Armor: 'Armor',
  Garment: 'Engine Wing',
  Shoes: 'Leg',
  Accessory: 'Booster / Battle Chip',
}

export const PIECES = Object.keys(PIECE_LABEL) as AutomaticPiece[]

/** "Automatic Module(Cannon Tornado)" -> "Cannon Tornado". */
export function moduleTitle(m: AutomaticModule) {
  return m.name.match(/\(([^)]*)\)\s*$/)?.[1] ?? m.name
}

/** Só o efeito: sem a introdução ("Modified module…") nem o título "[Enchantment Effect]". */
export function effectLines(m: AutomaticModule) {
  const first = m.description.findIndex(isSeparator)
  const lines = first === -1 ? m.description : m.description.slice(first + 1)
  return lines.filter((l) => !/^\[Enchantment Effect\]$/i.test(stripColors(l).trim()))
}

/**
 * Limites por peça e raridade a partir dos dados: [mín, máx] de cópias do mesmo módulo
 * e quantos módulos daquela raridade cabem na peça. null = raridade não encaixa na peça.
 */
export function pieceLimits(modules: AutomaticModule[]) {
  const out = {} as Record<AutomaticPiece, Partial<Record<ModuleGrade, { min: number; max: number; count: number }>>>
  for (const piece of PIECES) out[piece] = {}
  for (const m of modules) {
    for (const p of m.pieces) {
      const cell = out[p.piece][m.grade]
      if (!cell) out[p.piece][m.grade] = { min: p.max, max: p.max, count: 1 }
      else {
        cell.min = Math.min(cell.min, p.max)
        cell.max = Math.max(cell.max, p.max)
        cell.count++
      }
    }
  }
  return out
}
