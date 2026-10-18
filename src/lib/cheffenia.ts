import type { CheffeniaData, CheffeniaMob, Difficulty, Element } from '@/lib/types'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  hard: 'Hard',
  nightmare: 'Nightmare',
  hallucination: 'Hallucination',
}

export const DIFFICULTIES = Object.keys(DIFFICULTY_LABEL) as Difficulty[]

export const ELEMENT_LABEL: Record<Element, string> = {
  Neutral: 'Neutro',
  Water: 'Água',
  Earth: 'Terra',
  Fire: 'Fogo',
  Wind: 'Vento',
  Poison: 'Veneno',
  Holy: 'Sagrado',
  Dark: 'Sombrio',
  Ghost: 'Fantasma',
  Undead: 'Morto-vivo',
}

export const ELEMENTS = Object.keys(ELEMENT_LABEL) as Element[]

/** Cor de cada elemento (chip/badge). */
export const ELEMENT_STYLE: Record<Element, string> = {
  Neutral: 'bg-zinc-500/15 text-zinc-200 ring-zinc-400/30',
  Water: 'bg-sky-500/15 text-sky-300 ring-sky-400/35',
  Earth: 'bg-amber-700/20 text-amber-300 ring-amber-600/40',
  Fire: 'bg-red-500/15 text-red-300 ring-red-400/35',
  Wind: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/35',
  Poison: 'bg-lime-500/15 text-lime-300 ring-lime-400/35',
  Holy: 'bg-yellow-400/15 text-yellow-200 ring-yellow-300/40',
  Dark: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/35',
  Ghost: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/35',
  Undead: 'bg-stone-500/20 text-stone-300 ring-stone-400/35',
}

/** % de dano de um ataque do elemento `atk` no monstro (attr_fix.yml); null = sem dados. */
export function damageRate(data: CheffeniaData, atk: Element, mob: CheffeniaMob): number | null {
  if (!mob.element || !mob.elementLevel) return null
  return data.attr[String(mob.elementLevel)]?.[atk]?.[mob.element] ?? null
}

/** Elemento(s) que mais causam dano no monstro e o %. */
export function bestElements(data: CheffeniaData, mob: CheffeniaMob) {
  let best = -Infinity
  let elements: Element[] = []
  for (const e of ELEMENTS) {
    const r = damageRate(data, e, mob)
    if (r === null) continue
    if (r > best) {
      best = r
      elements = [e]
    } else if (r === best) elements.push(e)
  }
  return elements.length ? { rate: best, elements } : null
}

/** Faixa de cor do % de dano: forte, normal, fraco, imune, cura. */
export function rateTone(rate: number) {
  if (rate < 0) return 'heal'
  if (rate === 0) return 'immune'
  if (rate < 100) return 'weak'
  if (rate === 100) return 'normal'
  return 'strong'
}

export const TONE_STYLE: Record<ReturnType<typeof rateTone>, { text: string; bar: string; label: string }> = {
  strong: { text: 'text-emerald-300', bar: 'bg-emerald-400', label: 'efetivo' },
  normal: { text: 'text-foreground/80', bar: 'bg-zinc-400', label: 'normal' },
  weak: { text: 'text-amber-300', bar: 'bg-amber-400', label: 'reduzido' },
  immune: { text: 'text-rose-300', bar: 'bg-rose-400', label: 'imune' },
  heal: { text: 'text-fuchsia-300', bar: 'bg-fuchsia-400', label: 'cura o alvo' },
}
