import {
  Crown,
  Footprints,
  Gem,
  Shield,
  Shirt,
  Sword,
  Wind,
  type LucideIcon,
} from 'lucide-react'

import type { Slot } from '@/lib/types'

export const COLOR_CODE = /\^([0-9a-fA-F]{6})/g

/** Remove os códigos de cor ^RRGGBB do client (para busca e textos simples). */
export function stripColors(text: string) {
  return text.replace(COLOR_CODE, '')
}

/** Linha "_______" que o client usa para separar blocos da descrição. */
export function isSeparator(line: string) {
  return /^_{8,}$/.test(stripColors(line).trim())
}

/** Linhas com conteúdo (sem vazias nem separadores), para prévias compactas. */
export function contentLines(lines: string[]) {
  return lines.filter((line) => stripColors(line).trim() && !isSeparator(line))
}

/**
 * As cores do client foram pensadas para fundo branco. No tema escuro,
 * clareamos as que ficariam ilegíveis mantendo o matiz.
 */
export function readableColor(hex: string) {
  const n = parseInt(hex, 16)
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return `hsl(0 0% ${Math.max(l, 0.62) * 100}%)`
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return `hsl(${h} ${Math.min(s, 0.85) * 100}% ${Math.max(l, 0.68) * 100}%)`
}

export const SLOT_INFO: Record<Slot, { label: string; icon: LucideIcon; color: string; className: string }> = {
  Weapon: { label: 'Arma', icon: Sword, color: 'text-rose-300', className: 'text-rose-300 bg-rose-500/10 ring-rose-400/20' },
  Shield: { label: 'Escudo', icon: Shield, color: 'text-sky-300', className: 'text-sky-300 bg-sky-500/10 ring-sky-400/20' },
  Armor: { label: 'Armadura', icon: Shirt, color: 'text-amber-300', className: 'text-amber-300 bg-amber-500/10 ring-amber-400/20' },
  Garment: { label: 'Capa', icon: Wind, color: 'text-teal-300', className: 'text-teal-300 bg-teal-500/10 ring-teal-400/20' },
  Shoes: { label: 'Calçado', icon: Footprints, color: 'text-lime-300', className: 'text-lime-300 bg-lime-500/10 ring-lime-400/20' },
  Headgear: { label: 'Cabeça', icon: Crown, color: 'text-violet-300', className: 'text-violet-300 bg-violet-500/10 ring-violet-400/20' },
  Accessory: { label: 'Acessório', icon: Gem, color: 'text-fuchsia-300', className: 'text-fuchsia-300 bg-fuchsia-500/10 ring-fuchsia-400/20' },
}
