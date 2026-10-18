import { AlertTriangle, Repeat, Sparkles, Trophy, UserPen } from 'lucide-react'

import { MobSprite } from '@/components/cheffenia/mob-sprite'
import {
  ELEMENTS,
  ELEMENT_LABEL,
  ELEMENT_STYLE,
  MAX_CUSTOM,
  TONE_STYLE,
  rateTone,
  type ElementPlan as Plan,
  type PlanMode,
} from '@/lib/cheffenia'
import type { Element } from '@/lib/types'
import { cn } from '@/lib/utils'

const COUNTS = [1, 2, 3, 4]

function ElementChips({ elements, size = 'md' }: { elements: Element[]; size?: 'sm' | 'md' }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {elements.map((e, i) => (
        <span key={e} className="flex items-center gap-1.5">
          {i > 0 && <Repeat className={cn('text-muted-foreground', size === 'md' ? 'size-3.5' : 'size-3')} />}
          <span
            className={cn(
              'rounded-full font-semibold ring-1 ring-inset',
              size === 'md' ? 'px-3.5 py-1 text-base' : 'px-2 py-0.5 text-xs',
              ELEMENT_STYLE[e],
            )}
          >
            {ELEMENT_LABEL[e]}
          </span>
        </span>
      ))}
    </span>
  )
}

function Stat({ label, value, tone = 'text-emerald-300' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn('font-mono text-sm font-semibold', tone)}>{value}</dd>
    </div>
  )
}

/** "0,7%" / "12%": uma casa decimal só para diferenças pequenas. */
function pctText(n: number) {
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: n < 10 ? 1 : 0 })}%`
}

/** Diferença de tempo de `plan` em relação a `ref` (positivo = mais rápido). */
function speedVs(plan: Plan, ref: Plan) {
  return ref.cost > 0 && plan.cost > 0 ? (1 - plan.cost / ref.cost) * 100 : 0
}

/**
 * Quais elementos levar para matar todos os monstros da dificuldade mais rápido e em qual monstro usar
 * cada um: a combinação recomendada (com alternativas) ou os elementos escolhidos pelo usuário.
 */
export function ElementPlan({
  mode,
  onMode,
  count,
  onCount,
  custom,
  onCustom,
  plan,
  alternatives,
  single,
  reference,
  total,
}: {
  mode: PlanMode
  onMode: (mode: PlanMode) => void
  count: number
  onCount: (n: number) => void
  custom: Element[]
  onCustom: (elements: Element[]) => void
  /** Plano mostrado (recomendado ou o do usuário). */
  plan: Plan | null
  /** Melhores combinações com `count` elementos (a primeira é a recomendada). */
  alternatives: Plan[]
  /** Melhor elemento único, para comparação. */
  single: Plan | null
  /** No modo "meus elementos": o recomendado com a mesma quantidade de elementos. */
  reference: Plan | null
  total: number
}) {
  const recommended = alternatives[0]
  const toggle = (e: Element) =>
    onCustom(
      custom.includes(e)
        ? custom.filter((x) => x !== e)
        : custom.length < MAX_CUSTOM
          ? ELEMENTS.filter((x) => x === e || custom.includes(x))
          : custom,
    )
  const sameCount = mode === 'custom' ? reference : null

  const groups = plan
    ? plan.elements.map((element) => ({
        element,
        mobs: [...plan.assignment]
          .filter(([, a]) => a.element === element)
          .map(([m, a]) => ({ mob: m, rate: a.rate }))
          .sort((a, b) => b.rate - a.rate || a.mob.name.localeCompare(b.mob.name)),
      }))
    : []
  const n = plan?.elements.length ?? 0

  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-primary/25">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="font-medium">Plano de elementos</h2>
        <span className="text-xs text-muted-foreground">Matar todos os {total} monstros no menor tempo</span>
        <div className="ml-auto inline-flex rounded-lg bg-muted/40 p-1 ring-1 ring-foreground/10">
          {(
            [
              ['best', 'Recomendado', Trophy],
              ['custom', 'Meus elementos', UserPen],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => onMode(key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors',
                mode === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {mode === 'best' ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Quantos elementos você quer usar?
          <div className="inline-flex rounded-md bg-muted/40 p-0.5 ring-1 ring-foreground/10">
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCount(c)}
                className={cn(
                  'h-6 w-7 rounded font-mono text-xs transition-colors',
                  c === count ? 'bg-primary text-primary-foreground' : 'hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">
            Escolha de 1 a {MAX_CUSTOM} elementos que você tem ({custom.length}/{MAX_CUSTOM}):
          </span>
          <div className="flex flex-wrap gap-2">
            {ELEMENTS.map((e) => {
              const on = custom.includes(e)
              const blocked = !on && custom.length >= MAX_CUSTOM
              return (
                <button
                  key={e}
                  type="button"
                  aria-pressed={on}
                  disabled={blocked}
                  onClick={() => toggle(e)}
                  className={cn(
                    'rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-all',
                    ELEMENT_STYLE[e],
                    on ? 'ring-2 brightness-125' : 'opacity-50 hover:opacity-90',
                    blocked && 'cursor-not-allowed opacity-25 hover:opacity-25',
                  )}
                >
                  {ELEMENT_LABEL[e]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!plan ? (
        <p className="rounded-lg bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Marque pelo menos um elemento para ver o plano.
        </p>
      ) : (
        <>
          {/* resumo */}
          <div className="flex flex-wrap items-center gap-3">
            <ElementChips elements={plan.elements} />
            <dl className="ml-auto flex flex-wrap gap-2 text-xs">
              <Stat label="Dano efetivo médio" value={`${plan.effectiveRate.toFixed(0)}%`} />
              {single && n > 1 && (
                <Stat
                  label={`vs. só ${ELEMENT_LABEL[single.elements[0]]} (${single.effectiveRate.toFixed(0)}%)`}
                  value={speedVs(plan, single) > 0.05 ? `${pctText(speedVs(plan, single))} mais rápido` : 'igual'}
                />
              )}
              {sameCount && (
                <Stat
                  label={`vs. recomendado com ${n} (${sameCount.effectiveRate.toFixed(0)}%)`}
                  value={
                    speedVs(plan, sameCount) < -0.05
                      ? `${pctText(-speedVs(plan, sameCount))} mais lento`
                      : 'é o melhor ✓'
                  }
                  tone={speedVs(plan, sameCount) < -0.05 ? 'text-amber-300' : 'text-emerald-300'}
                />
              )}
            </dl>
          </div>

          {sameCount && speedVs(plan, sameCount) < -0.05 && (
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              Com {n} elemento{n > 1 ? 's' : ''}, o melhor seria
              <ElementChips elements={sameCount.elements} size="sm" />
              <button
                type="button"
                onClick={() => onCustom(ELEMENTS.filter((e) => sameCount.elements.includes(e)))}
                className="text-primary underline-offset-2 hover:underline"
              >
                usar estes
              </button>
            </p>
          )}

          {plan.unkillable.length > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200 ring-1 ring-rose-400/25">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Com esses elementos não dá para ferir: {plan.unkillable.map((m) => m.name).join(', ')}.
            </p>
          )}

          {/* em qual monstro usar cada elemento */}
          <div
            className={cn(
              'grid grid-cols-1 gap-3',
              n >= 2 && 'md:grid-cols-2',
              n >= 3 && 'xl:grid-cols-3',
              n >= 4 && '2xl:grid-cols-4',
            )}
          >
            {groups.map(({ element, mobs: list }) => (
              <div key={element} className="flex min-w-0 flex-col gap-2 rounded-lg bg-muted/20 p-3 ring-1 ring-foreground/10">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset', ELEMENT_STYLE[element])}>
                    {ELEMENT_LABEL[element]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {list.length ? `use em ${list.length} monstro${list.length === 1 ? '' : 's'}` : 'não é o melhor em nenhum'}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {list.map(({ mob, rate }) => (
                    <li key={mob.name} className="flex items-center gap-2.5 rounded-md px-1 py-0.5">
                      <MobSprite mob={mob} className="size-9 rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-sm">{mob.name}</span>
                      {mob.element && (
                        <span className={cn('shrink-0 rounded-full px-1.5 text-[10px] ring-1 ring-inset', ELEMENT_STYLE[mob.element])}>
                          {ELEMENT_LABEL[mob.element]} {mob.elementLevel}
                        </span>
                      )}
                      <span className={cn('w-11 shrink-0 text-right font-mono text-sm font-semibold', TONE_STYLE[rateTone(rate)].text)}>
                        {rate}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {/* outras boas combinações */}
      {mode === 'best' && alternatives.length > 1 && recommended && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">Outras boas opções com {count} elemento{count > 1 ? 's' : ''}</h3>
          <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-lg ring-1 ring-foreground/10">
            {alternatives.slice(1).map((alt, i) => (
              <li key={alt.elements.join()} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="w-5 font-mono text-xs text-muted-foreground">{i + 2}º</span>
                <ElementChips elements={alt.elements} size="sm" />
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {alt.effectiveRate.toFixed(0)}% · {pctText(-speedVs(alt, recommended))} mais lento
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onCustom(ELEMENTS.filter((e) => alt.elements.includes(e)))
                    onMode('custom')
                  }}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  ver plano
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Como todos têm o mesmo HP, o tempo para matar cada monstro é proporcional a 1 ÷ (% de dano). Em cada monstro
        é usado o melhor dos elementos escolhidos; o recomendado testa todas as combinações e fica com a de menor tempo
        total. O "dano efetivo médio" é a média harmônica das % (o que de fato reflete o tempo).
      </p>
    </section>
  )
}
