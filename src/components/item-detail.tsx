import type { ReactNode } from 'react'
import { Code, Crown, Gift, Package, ScrollText, Skull } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoText } from '@/components/ro-text'
import type { BaseItem, BoxSource, Drop } from '@/lib/types'

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</h4>
      {children}
    </section>
  )
}

export interface ScriptDef {
  label: string
  code: string | null | undefined
}

/** Efeito do item: texto oficial do client (inglês) ou o script do rAthena que é de fato executado. */
function EffectTabs({ description, scripts }: { description: string[]; scripts: ScriptDef[] }) {
  const present = scripts.filter((s) => s.code)
  const hasDescription = description.length > 0
  return (
    <Tabs defaultValue={hasDescription ? 'description' : 'script'} className="gap-3">
      <TabsList>
        <TabsTrigger value="description" className="px-2.5">
          <ScrollText />
          Descrição
        </TabsTrigger>
        <TabsTrigger value="script" className="px-2.5">
          <Code />
          Script
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        {hasDescription ? (
          <RoText lines={description} className="space-y-0.5 text-sm leading-relaxed" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Este item não tem descrição em inglês no client. Veja o script para o efeito real.
          </p>
        )}
      </TabsContent>
      <TabsContent value="script" className="flex flex-col gap-3">
        {present.length === 0 && <p className="text-sm text-muted-foreground">Este item não tem script.</p>}
        {present.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            {present.length > 1 && <span className="text-xs text-muted-foreground">{s.label}</span>}
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {s.code}
            </pre>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  )
}

function formatRate(rate: number) {
  return `${rate.toLocaleString('pt-BR', { maximumFractionDigits: rate < 0.1 ? 3 : 2 })}%`
}

const LIST = 'divide-y divide-border overflow-hidden rounded-lg ring-1 ring-foreground/10'

function DropList({ drops }: { drops: Drop[] }) {
  if (drops.length === 0) return <p className="text-sm text-muted-foreground">Nenhum monstro dropa este item.</p>
  return (
    <ul className={LIST}>
      {drops.map((mob, i) => (
        <li key={`${mob.id}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
          {mob.mvp ? (
            <Crown className="size-4 shrink-0 text-amber-400" aria-label="MVP" />
          ) : (
            <Skull
              className={mob.boss ? 'size-4 shrink-0 text-rose-400' : 'size-4 shrink-0 text-muted-foreground/50'}
              aria-label={mob.boss ? 'Boss' : undefined}
            />
          )}
          <span className="min-w-0 flex-1 truncate">{mob.name}</span>
          {mob.preRe && (
            <span
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase"
              title="Este drop só existe no pre-renewal; no renewal nenhum monstro dropa este item."
            >
              pre-renewal
            </span>
          )}
          {mob.mvpReward && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300" title="Recompensa entregue ao jogador MVP">
              <Gift className="size-3.5" />
              Prêmio MVP
            </span>
          )}
          <span className="text-xs text-muted-foreground">Nv. {mob.level}</span>
          <span className="w-16 text-right font-mono text-xs tabular-nums">{formatRate(mob.rate)}</span>
        </li>
      ))}
    </ul>
  )
}

function BoxList({ sources }: { sources: BoxSource[] }) {
  return (
    <ul className={LIST}>
      {sources.map((box) => (
        <li key={box.id} className="flex items-center gap-3 px-3 py-2 text-sm">
          <Package className="size-4 shrink-0 text-sky-300" />
          <span className="min-w-0 flex-1 truncate">{box.name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">#{box.id}</span>
          <span className="w-16 text-right font-mono text-xs tabular-nums">
            {box.chance >= 100 ? 'garantido' : formatRate(box.chance)}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Modal de detalhes de qualquer item: cabeçalho, metadados (children), efeito e drops.
 */
export function ItemDetailDialog({
  item,
  onClose,
  image,
  title,
  scripts,
  children,
  afterEffect,
}: {
  item: BaseItem | null
  onClose: () => void
  image: ReactNode
  title?: ReactNode
  scripts: ScriptDef[]
  children?: ReactNode
  /** Conteúdo exibido logo após as abas Descrição/Script (ex.: combos). */
  afterEffect?: ReactNode
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      {item && (
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-cols-[minmax(0,1fr)] gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-2xl">
          <div className="flex flex-col gap-5 p-5 sm:flex-row">
            <div className="mx-auto w-40 shrink-0 sm:mx-0">{image}</div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <DialogHeader className="pr-8">
                <DialogTitle className="text-lg">{title ?? item.name}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-2 font-mono text-xs">
                  <span>#{item.id}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{item.aegis}</span>
                  {item.krName && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="font-sans">{item.krName}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {children}

              <EffectTabs key={item.id} description={item.description} scripts={scripts} />
              {afterEffect}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-5 p-5">
            <DetailSection title={`Dropado por (${item.droppedBy.length})`}>
              <DropList drops={item.droppedBy} />
            </DetailSection>
            {item.obtainedFrom.length > 0 && (
              <DetailSection title={`Obtido em caixas e álbuns (${item.obtainedFrom.length})`}>
                <BoxList sources={item.obtainedFrom} />
              </DetailSection>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
