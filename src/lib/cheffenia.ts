import type { CheffeniaData, CheffeniaMob, Difficulty, Element } from '@/lib/types'

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  hard: 'Hard',
  nightmare: 'Nightmare',
  hallucination: 'Hallucination',
}

export const DIFFICULTIES = Object.keys(DIFFICULTY_LABEL) as Difficulty[]

/** Plano de elementos: o recomendado ou os elementos escolhidos pelo usuário (até MAX_CUSTOM). */
export type PlanMode = 'best' | 'custom'
export const MAX_CUSTOM = 4

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

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (items.length < k) return []
  const [first, ...rest] = items
  return [...combinations(rest, k - 1).map((c) => [first, ...c]), ...combinations(rest, k)]
}

export interface ElementPlan {
  elements: Element[]
  /** Monstro -> elemento a usar e a % de dano com ele. */
  assignment: Map<CheffeniaMob, { element: Element; rate: number }>
  /** Monstros que nenhum dos elementos consegue ferir (todos 0% ou cura). */
  unkillable: CheffeniaMob[]
  /** Média harmônica da % de dano: o "dano efetivo" considerando o tempo para matar todos. */
  effectiveRate: number
  /** Tempo relativo (soma de 1/%), menor é melhor. */
  cost: number
}

/** Avalia um conjunto fixo de elementos: em cada monstro, o melhor elemento do conjunto. */
export function evaluatePlan(data: CheffeniaData, mobs: CheffeniaMob[], combo: Element[]): ElementPlan | null {
  const valid = mobs.filter((m) => m.element)
  if (!valid.length || !combo.length) return null
  // ordem do conjunto: quem é o melhor isolado em mais monstros vem antes (desempate = menos trocas)
  const wins = new Map<Element, number>(combo.map((e) => [e, 0]))
  for (const m of valid) {
    const rates = combo.map((e) => damageRate(data, e, m) ?? 0)
    const top = Math.max(...rates)
    combo.forEach((e, i) => rates[i] === top && wins.set(e, wins.get(e)! + 1))
  }
  const ordered = [...combo].sort((a, b) => wins.get(b)! - wins.get(a)! || ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b))

  const assignment = new Map<CheffeniaMob, { element: Element; rate: number }>()
  const unkillable: CheffeniaMob[] = []
  let cost = 0
  for (const m of valid) {
    let pick = ordered[0]
    let rate = -Infinity
    for (const e of ordered) {
      const r = damageRate(data, e, m) ?? 0
      if (r > rate) {
        rate = r
        pick = e
      }
    }
    assignment.set(m, { element: pick, rate })
    if (rate <= 0) unkillable.push(m)
    else cost += 1 / rate
  }
  const killed = valid.length - unkillable.length
  return { elements: ordered, assignment, unkillable, cost, effectiveRate: killed ? killed / cost : 0 }
}

const better = (a: ElementPlan, b: ElementPlan) =>
  a.unkillable.length - b.unkillable.length || a.cost - b.cost

/**
 * Melhores conjuntos de `k` elementos de ataque para matar todos os monstros mais rápido: com o mesmo HP,
 * o tempo de cada um é proporcional a 1 / (% de dano), então minimiza a soma desse tempo usando o melhor
 * elemento do conjunto em cada monstro. Testa todas as combinações (no máximo 252) e devolve as `top`
 * melhores, da melhor para a pior. Conjuntos em que um elemento não é usado em nenhum monstro são
 * descartados (equivalem a um conjunto menor).
 */
export function bestPlans(data: CheffeniaData, mobs: CheffeniaMob[], k: number, top = 1): ElementPlan[] {
  const all: ElementPlan[] = []
  for (const combo of combinations(ELEMENTS, Math.min(k, ELEMENTS.length))) {
    const plan = evaluatePlan(data, mobs, combo)
    if (plan) all.push(plan)
  }
  const full = all.filter((p) => new Set([...p.assignment.values()].map((a) => a.element)).size === p.elements.length)
  return (full.length ? full : all).sort(better).slice(0, top)
}

export function bestPlan(data: CheffeniaData, mobs: CheffeniaMob[], k: number): ElementPlan | null {
  return bestPlans(data, mobs, k, 1)[0] ?? null
}
