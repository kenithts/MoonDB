import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Crown, Heart, Info, Swords, X } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { ElementPlan } from '@/components/cheffenia/element-plan'
import { MobSprite } from '@/components/cheffenia/mob-sprite'
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  ELEMENTS,
  ELEMENT_LABEL,
  ELEMENT_STYLE,
  TONE_STYLE,
  bestElements,
  bestPlan,
  bestPlans,
  evaluatePlan,
  type PlanMode,
  damageRate,
  rateTone,
} from '@/lib/cheffenia'
import { useCheffenia } from '@/lib/data'
import { formatNumber } from '@/lib/gray-wolf'
import type { CheffeniaData, CheffeniaMob, Difficulty, Element } from '@/lib/types'
import { cn } from '@/lib/utils'

const PILL = 'inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium ring-1 ring-inset'

function ElementBadge({ element, level, className }: { element: Element; level?: number; className?: string }) {
  return (
    <span className={cn(PILL, ELEMENT_STYLE[element], className)}>
      {ELEMENT_LABEL[element]}
      {level !== undefined && <span className="font-mono">{level}</span>}
    </span>
  )
}

/** Barra do % de dano: escala até 200% (acima disso a barra fica cheia). */
function RateBar({ element, rate }: { element: Element; rate: number }) {
  const tone = TONE_STYLE[rateTone(rate)]
  const width = Math.min(100, (Math.max(0, rate) / 200) * 100)
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2">
      <ElementBadge element={element} className="justify-center" />
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${width}%` }} />
        {/* marca dos 100% */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/30" />
      </div>
      <span className={cn('text-right font-mono text-sm font-semibold tabular-nums', tone.text)}>{rate}%</span>
    </div>
  )
}

function MobCard({
  mob,
  data,
  selected,
  use,
}: {
  mob: CheffeniaMob
  data: CheffeniaData
  selected: Element[]
  /** Elemento do plano para este monstro. */
  use?: { element: Element; rate: number }
}) {
  const best = bestElements(data, mob)
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <header className="flex items-start gap-3">
        <MobSprite mob={mob} className="size-20" />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-medium">
            {mob.mvp && <Crown className="size-4 shrink-0 text-amber-300" aria-label="MVP" />}
            <span className="truncate">{mob.name}</span>
          </h3>
          {mob.id ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {mob.rathenaName !== mob.name && <>{mob.rathenaName} · </>}
              <span className="font-mono">#{mob.id}</span> · Nv {mob.level}
              {mob.source === 'game' && <span className="ml-1.5 text-sky-300/90">· dados do jogo</span>}
            </p>
          ) : (
            <p className="text-[11px] text-amber-300/80">Sem dados no rAthena</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {mob.element && <ElementBadge element={mob.element} level={mob.elementLevel} />}
            {use && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                use
                <ElementBadge element={use.element} className="ring-2" />
                <span className={cn('font-mono font-semibold', TONE_STYLE[rateTone(use.rate)].text)}>{use.rate}%</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col rounded-md bg-muted/40 px-2 py-1.5">
          <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Heart className="size-3" /> HP
          </dt>
          <dd className="font-mono font-medium">{formatNumber(mob.hp)}</dd>
        </div>
        <div className="flex flex-col rounded-md bg-muted/40 px-2 py-1.5">
          <dt className="text-[11px] text-muted-foreground">Raça</dt>
          <dd className="truncate font-medium">{mob.race ?? '—'}</dd>
        </div>
        <div className="flex flex-col rounded-md bg-muted/40 px-2 py-1.5">
          <dt className="text-[11px] text-muted-foreground">Tamanho</dt>
          <dd className="truncate font-medium">{mob.size ?? '—'}</dd>
        </div>
      </dl>

      {best && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-emerald-500/5 px-2.5 py-2 ring-1 ring-emerald-400/20">
          <Swords className="size-3.5 text-emerald-300" />
          <span className="text-xs text-muted-foreground">Mais recebe dano de</span>
          {best.elements.length > ELEMENTS.length / 2 ? (
            <>
              <span className="text-xs">todos, exceto</span>
              {ELEMENTS.filter((e) => !best.elements.includes(e)).map((e) => (
                <ElementBadge key={e} element={e} className="opacity-70" />
              ))}
            </>
          ) : (
            best.elements.map((e) => <ElementBadge key={e} element={e} />)
          )}
          <span className="ml-auto font-mono text-sm font-semibold text-emerald-300">{best.rate}%</span>
        </div>
      )}

      {selected.length > 0 && mob.element && (
        <div className="flex flex-col gap-1.5">
          {selected.map((e) => (
            <RateBar key={e} element={e} rate={damageRate(data, e, mob) ?? 100} />
          ))}
        </div>
      )}
    </article>
  )
}

function Cheffenia({ data }: { data: CheffeniaData }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('nightmare')
  const [selected, setSelected] = useState<Element[]>([])
  const [sortByDamage, setSortByDamage] = useState(false)
  const [planCount, setPlanCount] = useState(3)
  const [planMode, setPlanMode] = useState<PlanMode>('best')
  const [custom, setCustom] = useState<Element[]>([])

  const toggle = (e: Element) =>
    setSelected((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : ELEMENTS.filter((x) => x === e || cur.includes(x))))

  const mobs = useMemo(() => data.difficulties[difficulty] ?? [], [data, difficulty])
  const alternatives = useMemo(() => bestPlans(data, mobs, planCount, 5), [data, mobs, planCount])
  const single = useMemo(() => bestPlan(data, mobs, 1), [data, mobs])
  const customPlan = useMemo(() => evaluatePlan(data, mobs, custom), [data, mobs, custom])
  const reference = useMemo(
    () => (custom.length ? bestPlan(data, mobs, custom.length) : null),
    [data, mobs, custom.length],
  )
  const plan = planMode === 'custom' ? customPlan : (alternatives[0] ?? null)
  const shown = useMemo(() => {
    if (!sortByDamage || !selected.length) return mobs
    // ordena pelo melhor % entre os elementos marcados (sem dados vão para o fim)
    const score = (m: CheffeniaMob) => Math.max(...selected.map((e) => damageRate(data, e, m) ?? -Infinity))
    return [...mobs].sort((a, b) => score(b) - score(a))
  }, [mobs, selected, sortByDamage, data])

  return (
    <div className="flex flex-col gap-5">
      {/* dificuldade */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Dificuldade</span>
        <div className="inline-flex rounded-lg bg-muted/40 p-1 ring-1 ring-foreground/10">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                d === difficulty ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {DIFFICULTY_LABEL[d]}
              <span className="ml-1.5 font-mono text-[10px] opacity-70">{data.difficulties[d]?.length ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {mobs.length > 0 && (
        <ElementPlan
          mode={planMode}
          onMode={(m) => {
            // ao abrir "meus elementos" sem nada marcado, começa pelo recomendado
            const seed = alternatives[0]
            if (m === 'custom' && seed)
              setCustom((cur) => (cur.length ? cur : ELEMENTS.filter((e) => seed.elements.includes(e))))
            setPlanMode(m)
          }}
          count={planCount}
          onCount={setPlanCount}
          custom={custom}
          onCustom={setCustom}
          plan={plan}
          alternatives={alternatives}
          single={single}
          reference={reference}
          total={mobs.filter((m) => m.element).length}
        />
      )}

      {/* filtro de elementos */}
      <section className="flex flex-col gap-2.5 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
        <div className="flex flex-wrap items-center gap-2">
          <Info className="size-4 text-primary" />
          <span className="text-sm font-medium">Elemento do seu ataque</span>
          <span className="text-xs text-muted-foreground">
            Marque um ou mais para ver quanto % do dano você causa em cada monstro.
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Limpar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ELEMENTS.map((e) => {
            const on = selected.includes(e)
            return (
              <button
                key={e}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(e)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-all',
                  ELEMENT_STYLE[e],
                  on ? 'ring-2 brightness-125' : 'opacity-50 hover:opacity-90',
                )}
              >
                {ELEMENT_LABEL[e]}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {(['strong', 'normal', 'weak', 'immune', 'heal'] as const).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', TONE_STYLE[t].bar)} />
              {TONE_STYLE[t].label}
            </span>
          ))}
          <span>· a linha no meio da barra marca 100%</span>
          {selected.length > 0 && (
            <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={sortByDamage}
                onChange={(e) => setSortByDamage(e.target.checked)}
                className="accent-primary"
              />
              <ArrowDownWideNarrow className="size-3.5" />
              Ordenar pelo maior dano
            </label>
          )}
        </div>
      </section>

      {mobs.length === 0 ? (
        <p className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Nenhum monstro cadastrado em {DIFFICULTY_LABEL[difficulty]} ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => (
            <MobCard key={m.name} mob={m} data={data} selected={selected} use={plan?.assignment.get(m)} />
          ))}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Elemento, raça e tamanho vêm da versão original de cada monstro no rAthena (db/re/mob_db.yml), exceto os
        marcados "dados do jogo" (lidos no jogo, o rAthena não tem o monstro); a % de dano vem da tabela de elementos
        (db/re/attr_fix.yml). HP fixo de 1.000.000 para todos.
      </p>
    </div>
  )
}

export function CheffeniaTab() {
  const state = useCheffenia()
  if (state.status === 'error') return <p className="text-sm text-destructive">Erro ao carregar ({state.error}).</p>
  if (state.status === 'loading')
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  return <Cheffenia data={state.data} />
}
